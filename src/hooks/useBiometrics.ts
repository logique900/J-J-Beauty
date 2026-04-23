import { useState, useCallback } from 'react';

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check if WebAuthn is supported and specifically if a platform authenticator (like TouchID/FaceID) is available
  const checkSupport = useCallback(async () => {
    if (window.PublicKeyCredential) {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsSupported(available);
      return available;
    }
    setIsSupported(false);
    return false;
  }, []);

  const registerBiometrics = useCallback(async (userId: string, email: string) => {
    if (!window.PublicKeyCredential) return null;

    // This is a simplified frontend implementation.
    // In a real app, you'd get these options from your server.
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32))),
      rp: {
        name: "J&J Beauty",
        id: window.location.hostname,
      },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
      },
      timeout: 60000,
      attestation: "direct",
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });
      return credential;
    } catch (err) {
      console.error("Error registering biometrics:", err);
      return null;
    }
  }, []);

  const authenticateBiometrics = useCallback(async () => {
    if (!window.PublicKeyCredential) return null;

    // Simplified options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32))),
      allowCredentials: [], // In real app, you'd pass allowed credential IDs
      userVerification: "required",
      timeout: 60000,
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });
      return assertion;
    } catch (err) {
      console.error("Error authenticating with biometrics:", err);
      return null;
    }
  }, []);

  return {
    isSupported,
    checkSupport,
    registerBiometrics,
    authenticateBiometrics
  };
}
