import { useState, useCallback } from 'react';

// Helpers to convert between ArrayBuffer and Base64URL for storage
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64URLToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

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

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "J&J Beauty",
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName: email.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60000,
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) return null;

      // Extract parts for storage
      const response = credential.response as AuthenticatorAttestationResponse;
      
      return {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        attestationObject: bufferToBase64URL(response.attestationObject),
        clientDataJSON: bufferToBase64URL(response.clientDataJSON),
      };
    } catch (err) {
      console.error("Registration error:", err);
      return null;
    }
  }, []);

  const authenticateBiometrics = useCallback(async (allowedCredentialIds?: string[]) => {
    if (!window.PublicKeyCredential) return null;

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));

    const options: PublicKeyCredentialRequestOptions = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: "required",
      timeout: 60000,
      allowCredentials: allowedCredentialIds?.map(id => ({
        id: base64URLToBuffer(id),
        type: 'public-key',
        transports: ['internal']
      })) || [],
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: options,
      }) as PublicKeyCredential;

      if (!assertion) return null;

      const response = assertion.response as AuthenticatorAssertionResponse;

      return {
        id: assertion.id,
        rawId: bufferToBase64URL(assertion.rawId),
        type: assertion.type,
        authenticatorData: bufferToBase64URL(response.authenticatorData),
        clientDataJSON: bufferToBase64URL(response.clientDataJSON),
        signature: bufferToBase64URL(response.signature),
        userHandle: response.userHandle ? bufferToBase64URL(response.userHandle) : null,
      };
    } catch (err) {
      console.error("Authentication error:", err);
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
