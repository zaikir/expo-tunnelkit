//
//  CryptoCTR.m
//  TunnelKit
//
//  Created by Davide De Rosa on 9/18/18.
//  Copyright (c) 2021 Davide De Rosa. All rights reserved.
//
//  https://github.com/passepartoutvpn
//
//  This file is part of TunnelKit.
//
//  TunnelKit is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  TunnelKit is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with TunnelKit.  If not, see <http://www.gnu.org/licenses/>.
//

#import <openssl/evp.h>
#import <openssl/hmac.h>

#import "CryptoCTR.h"
#import "CryptoMacros.h"
#import "PacketMacros.h"
#import "ZeroingData.h"
#import "Allocation.h"
#import "Errors.h"

static const NSInteger CryptoCTRTagLength = 32;

@interface CryptoCTR ()

@property (nonatomic, unsafe_unretained) const EVP_CIPHER *cipher;
@property (nonatomic, unsafe_unretained) const EVP_MD *digest;
@property (nonatomic, unsafe_unretained) const NSString *digestName;
@property (nonatomic, assign) int cipherKeyLength;
@property (nonatomic, assign) int cipherIVLength;
@property (nonatomic, assign) int hmacKeyLength;

@property (nonatomic, unsafe_unretained) EVP_CIPHER_CTX *cipherCtxEnc;
@property (nonatomic, unsafe_unretained) EVP_CIPHER_CTX *cipherCtxDec;
@property (nonatomic, unsafe_unretained) EVP_MAC *macEnc;
@property (nonatomic, unsafe_unretained) EVP_MAC *macDec;
@property (nonatomic, unsafe_unretained) EVP_MAC_CTX *macCtxEnc;
@property (nonatomic, unsafe_unretained) EVP_MAC_CTX *macCtxDec;
@property (nonatomic, unsafe_unretained) uint8_t *bufferDecHMAC;

@end

@implementation CryptoCTR

- (instancetype)initWithCipherName:(NSString *)cipherName digestName:(NSString *)digestName
{
    NSParameterAssert(cipherName && [[cipherName uppercaseString] hasSuffix:@"CTR"]);
    NSParameterAssert(digestName);
    
    self = [super init];
    if (self) {
        self.cipher = EVP_get_cipherbyname([cipherName cStringUsingEncoding:NSASCIIStringEncoding]);
        NSAssert(self.cipher, @"Unknown cipher '%@'", cipherName);
        self.digestName = digestName;
        self.digest = EVP_get_digestbyname([digestName cStringUsingEncoding:NSASCIIStringEncoding]);
        NSAssert(self.digest, @"Unknown digest '%@'", digestName);
        
        self.cipherKeyLength = EVP_CIPHER_key_length(self.cipher);
        self.cipherIVLength = EVP_CIPHER_iv_length(self.cipher);
        // as seen in OpenVPN's crypto_openssl.c:md_kt_size()
        self.hmacKeyLength = (int)EVP_MD_size(self.digest);
        NSAssert(EVP_MD_size(self.digest) == CryptoCTRTagLength, @"Expected digest size to be tag length (%ld)", CryptoCTRTagLength);
        
        self.cipherCtxEnc = EVP_CIPHER_CTX_new();
        self.cipherCtxDec = EVP_CIPHER_CTX_new();
        self.macEnc = EVP_MAC_fetch(NULL, "HMAC", NULL);
        self.macDec = EVP_MAC_fetch(NULL, "HMAC", NULL);
        self.macCtxEnc = EVP_MAC_CTX_new(self.macEnc);
        self.macCtxDec = EVP_MAC_CTX_new(self.macDec);
        self.bufferDecHMAC = allocate_safely(CryptoCTRTagLength);
    }
    return self;
}

- (void)dealloc
{
    EVP_CIPHER_CTX_free(self.cipherCtxEnc);
    EVP_CIPHER_CTX_free(self.cipherCtxDec);
    EVP_MAC_free(self.macEnc);
    EVP_MAC_free(self.macDec);
    EVP_MAC_CTX_free(self.macCtxEnc);
    EVP_MAC_CTX_free(self.macCtxDec);
    bzero(self.bufferDecHMAC, CryptoCTRTagLength);
    free(self.bufferDecHMAC);
    
    self.cipher = NULL;
    self.digest = NULL;
}

- (int)digestLength
{
    return CryptoCTRTagLength;
}

- (int)tagLength
{
    return CryptoCTRTagLength;
}

- (NSInteger)encryptionCapacityWithLength:(NSInteger)length
{
    return safe_crypto_capacity(length, PacketOpcodeLength + PacketSessionIdLength + PacketReplayIdLength + PacketReplayTimestampLength + CryptoCTRTagLength);
}

#pragma mark Encrypter

- (void)configureEncryptionWithCipherKey:(ZeroingData *)cipherKey hmacKey:(ZeroingData *)hmacKey
{
    NSParameterAssert(hmacKey);
    NSParameterAssert(hmacKey.count >= self.hmacKeyLength);
    NSParameterAssert(cipherKey.count >= self.cipherKeyLength);
    
    EVP_CIPHER_CTX_reset(self.cipherCtxEnc);
    EVP_CipherInit(self.cipherCtxEnc, self.cipher, cipherKey.bytes, NULL, 1);

    OSSL_PARAM params[2];
    params[0] = OSSL_PARAM_construct_utf8_string("digest", (char *)[self.digestName cStringUsingEncoding:NSASCIIStringEncoding], 0);
    params[1] = OSSL_PARAM_construct_end();
    EVP_MAC_init(self.macCtxEnc, hmacKey.bytes, self.hmacKeyLength, params);
}

- (BOOL)encryptBytes:(const uint8_t *)bytes length:(NSInteger)length dest:(uint8_t *)dest destLength:(NSInteger *)destLength flags:(const CryptoFlags * _Nullable)flags error:(NSError * _Nullable __autoreleasing * _Nullable)error
{
    NSParameterAssert(flags);

    uint8_t *outEncrypted = dest + CryptoCTRTagLength;
    int l1 = 0, l2 = 0;
    size_t l3 = 0;
    int code = 1;
    
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_init(self.macCtxEnc, NULL, 0, NULL);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_update(self.macCtxEnc, flags->ad, flags->adLength);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_update(self.macCtxEnc, bytes, length);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_final(self.macCtxEnc, dest, &l3, (size_t)destLength);
    
    NSAssert(l3 == CryptoCTRTagLength, @"Incorrect digest size");
    
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_CipherInit(self.cipherCtxEnc, NULL, NULL, dest, -1);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_CipherUpdate(self.cipherCtxEnc, outEncrypted, &l1, bytes, (int)length);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_CipherFinal_ex(self.cipherCtxEnc, outEncrypted + l1, &l2);
    
    *destLength = CryptoCTRTagLength + l1 + l2;
    
    TUNNEL_CRYPTO_RETURN_STATUS(code)
}

- (id<DataPathEncrypter>)dataPathEncrypter
{
    [NSException raise:NSInvalidArgumentException format:@"DataPathEncryption not supported"];
    return nil;
}

#pragma mark Decrypter

- (void)configureDecryptionWithCipherKey:(ZeroingData *)cipherKey hmacKey:(ZeroingData *)hmacKey
{
    NSParameterAssert(hmacKey);
    NSParameterAssert(hmacKey.count >= self.hmacKeyLength);
    NSParameterAssert(cipherKey.count >= self.cipherKeyLength);
    
    EVP_CIPHER_CTX_reset(self.cipherCtxDec);
    EVP_CipherInit(self.cipherCtxDec, self.cipher, cipherKey.bytes, NULL, 0);

    OSSL_PARAM params[2];
    params[0] = OSSL_PARAM_construct_utf8_string("digest", (char *)[self.digestName cStringUsingEncoding:NSASCIIStringEncoding], 0);
    params[1] = OSSL_PARAM_construct_end();
    EVP_MAC_init(self.macCtxDec, hmacKey.bytes, self.hmacKeyLength, params);
}

- (BOOL)decryptBytes:(const uint8_t *)bytes length:(NSInteger)length dest:(uint8_t *)dest destLength:(NSInteger *)destLength flags:(const CryptoFlags * _Nullable)flags error:(NSError * _Nullable __autoreleasing * _Nullable)error
{
    NSParameterAssert(flags);
    NSAssert(self.cipher, @"No cipher provided");

    const uint8_t *iv = bytes;
    const uint8_t *encrypted = bytes + CryptoCTRTagLength;
    int l1 = 0, l2 = 0;
    size_t l3 = 0;
    int code = 1;

    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_CipherInit(self.cipherCtxDec, NULL, NULL, iv, -1);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_CipherUpdate(self.cipherCtxDec, dest, &l1, encrypted, (int)length - CryptoCTRTagLength);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_CipherFinal_ex(self.cipherCtxDec, dest + l1, &l2);

    *destLength = l1 + l2;
    
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_init(self.macCtxDec, NULL, 0, NULL);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_update(self.macCtxDec, flags->ad, flags->adLength);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_update(self.macCtxDec, dest, *destLength);
    TUNNEL_CRYPTO_TRACK_STATUS(code) EVP_MAC_final(self.macCtxDec, self.bufferDecHMAC, &l3, sizeof(self.bufferDecHMAC));
    
    NSAssert(l3 == CryptoCTRTagLength, @"Incorrect digest size");
    
    if (TUNNEL_CRYPTO_SUCCESS(code) && CRYPTO_memcmp(self.bufferDecHMAC, bytes, CryptoCTRTagLength) != 0) {
        if (error) {
            *error = OpenVPNErrorWithCode(OpenVPNErrorCodeCryptoHMAC);
        }
        return NO;
    }
    
    TUNNEL_CRYPTO_RETURN_STATUS(code)
}

- (BOOL)verifyBytes:(const uint8_t *)bytes length:(NSInteger)length flags:(const CryptoFlags * _Nullable)flags error:(NSError * _Nullable __autoreleasing * _Nullable)error
{
    [NSException raise:NSInvalidArgumentException format:@"Verification not supported"];
    return NO;
}

- (id<DataPathDecrypter>)dataPathDecrypter
{
    [NSException raise:NSInvalidArgumentException format:@"DataPathEncryption not supported"];
    return nil;
}

@end
