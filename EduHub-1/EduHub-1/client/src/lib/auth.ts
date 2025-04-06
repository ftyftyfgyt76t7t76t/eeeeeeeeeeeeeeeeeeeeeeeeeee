import { auth } from "./firebase";
import { configureRecaptchaVerifier } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  multiFactor,
  PhoneMultiFactorGenerator,
  MultiFactorSession,
  MultiFactorResolver
} from "firebase/auth";
import { apiRequest } from "./queryClient";

// Store verification sessions and resolvers for MFA
let verificationSession: MultiFactorSession | null = null;
let multiFactorResolver: MultiFactorResolver | null = null;

export async function registerUser(
  email: string, 
  password: string, 
  userData: any,
  phoneNumber?: string
) {
  // First create user in Firebase
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Update profile with displayName
  await updateProfile(firebaseUser, {
    displayName: userData.fullName
  });
  
  // Then register user in our backend
  const response = await apiRequest("POST", "/api/auth/register", {
    email,
    password, // In a real app, we wouldn't store the raw password in our DB
    ...userData
  });
  
  return response.json();
}

// Initiate phone verification for MFA enrollment
export async function initiatePhoneVerification(phoneNumber: string, recaptchaContainerId: string) {
  const recaptchaVerifier = configureRecaptchaVerifier(recaptchaContainerId);
  
  if (!auth.currentUser) {
    throw new Error('User must be logged in to enroll in MFA');
  }
  
  // Get the multiFactor object for the current user
  const multiFactorUser = multiFactor(auth.currentUser);
  
  // Start the enrollment process
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  verificationSession = await multiFactorUser.getSession();
  
  // Send verification code to the user's phone
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    {
      phoneNumber,
      session: verificationSession
    }, 
    recaptchaVerifier
  );
  
  return verificationId;
}

// Complete MFA enrollment with verification code
export async function completePhoneVerification(verificationId: string, verificationCode: string) {
  if (!auth.currentUser || !verificationSession) {
    throw new Error('Missing verification session or user');
  }
  
  const multiFactorUser = multiFactor(auth.currentUser);
  
  // Create the phone credential
  const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
  
  // Enroll the user in MFA
  await multiFactorUser.enroll(multiFactorAssertion, "Mobile Phone");
}

export async function loginUser(email: string, password: string) {
  try {
    // First attempt login with Firebase
    await signInWithEmailAndPassword(auth, email, password);
    
    // If successful, login with our backend
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password
    });
    
    return { success: true, user: await response.json() };
  } catch (error: any) {
    // Check if this is a multi-factor auth error
    if (error.code === 'auth/multi-factor-auth-required') {
      // Get the resolver
      multiFactorResolver = error.resolver;
      
      // Make sure the resolver exists and has hints
      if (multiFactorResolver && multiFactorResolver.hints) {
        // Return the MFA required response
        return { 
          success: false, 
          mfaRequired: true,
          hints: multiFactorResolver.hints.map(hint => ({
            uid: hint.uid,
            factorId: hint.factorId,
            phoneNumber: hint.displayName || 'Phone number'
          }))
        };
      } else {
        // Fallback if resolver doesn't exist
        return {
          success: false,
          mfaRequired: true,
          hints: []
        };
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Send verification code for MFA login
export async function sendMfaVerificationCode(recaptchaContainerId: string, hintUid?: string) {
  if (!multiFactorResolver) {
    throw new Error('MFA resolver not found');
  }
  
  const recaptchaVerifier = configureRecaptchaVerifier(recaptchaContainerId);
  
  // Use the first hint if none specified
  const selectedHint = hintUid 
    ? multiFactorResolver.hints.find(hint => hint.uid === hintUid) 
    : multiFactorResolver.hints[0];
  
  if (!selectedHint) {
    throw new Error('Selected MFA hint not found');
  }
  
  // Request verification code
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    {
      multiFactorHint: selectedHint,
      session: multiFactorResolver.session
    },
    recaptchaVerifier
  );
  
  return verificationId;
}

// Complete MFA login with verification code
export async function completeMfaLogin(verificationId: string, verificationCode: string) {
  if (!multiFactorResolver) {
    throw new Error('MFA resolver not found');
  }
  
  // Create the phone credential
  const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential);
  
  // Complete sign-in
  const userCredential = await multiFactorResolver.resolveSignIn(multiFactorAssertion);
  
  // If successful, login with our backend
  const response = await apiRequest("POST", "/api/auth/login", {
    email: userCredential.user.email,
  });
  
  return { success: true, user: await response.json() };
}

export async function logoutUser() {
  // Logout from Firebase
  await signOut(auth);
  
  // Logout from our backend
  await apiRequest("POST", "/api/auth/logout", {});
}

export async function createDemoUser(role: string) {
  const response = await apiRequest("POST", "/api/auth/demo", { role });
  return response.json();
}

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
