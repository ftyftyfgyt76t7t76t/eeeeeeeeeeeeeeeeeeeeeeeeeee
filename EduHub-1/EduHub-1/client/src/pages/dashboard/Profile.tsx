import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useFileUpload } from "@/hooks/use-file-upload";
import { UserRoleType } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { updatePassword } from "firebase/auth";

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  schoolName?: string;
  age?: string;
  grade?: string;
  address?: string;
  teachingGrades?: string;
  ceoName?: string;
}

export default function Profile() {
  const { user, isDemo } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();
  const { uploadFile, isUploading } = useFileUpload();

  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    schoolName: "",
    age: "",
    grade: "",
    address: "",
    teachingGrades: "",
    ceoName: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update form data when user data becomes available
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        schoolName: user.schoolName || "",
        age: user.age ? String(user.age) : "",
        grade: user.grade || "",
        address: user.address || "",
        teachingGrades: user.teachingGrades || "",
        ceoName: user.ceoName || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Profile updates are disabled in demo mode.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await apiRequest("POST", `/api/users/${user?.id}/update`, profileData);
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      // Invalidate current user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Password changes are disabled in demo mode.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "The new password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Update password in Firebase
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        
        // Update password in our backend
        await apiRequest("POST", `/api/users/${user?.id}/update-password`, {
          password: newPassword,
        });
        
        setNewPassword("");
        setConfirmPassword("");
        
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully.",
        });
      } else {
        throw new Error("User not authenticated");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast({
        title: "Password Change Failed",
        description: "There was an error changing your password. You may need to re-login before changing your password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Profile picture uploads are disabled in demo mode.",
        variant: "destructive",
      });
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const profilePictureUrl = await uploadFile(file, `profile-pictures/${user?.id}`);
      
      // Update user profile with new picture URL
      await apiRequest("POST", `/api/users/${user?.id}/update`, {
        ...profileData,
        profilePicture: profilePictureUrl,
      });
      
      // Invalidate current user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/current-user"] });
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine which fields to show based on user role
  const renderRoleSpecificFields = () => {
    if (!user) return null;
    
    switch (user.role as UserRoleType) {
      case "student":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={profileData.schoolName || ""}
                  onChange={(e) => setProfileData({...profileData, schoolName: e.target.value})}
                  placeholder="Your school name"
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={profileData.grade || ""}
                  onChange={(e) => setProfileData({...profileData, grade: e.target.value})}
                  placeholder="Your grade"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profileData.age || ""}
                  onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                  placeholder="Your age"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileData.address || ""}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  placeholder="Your address"
                />
              </div>
            </div>
          </>
        );
      case "teacher":
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={profileData.schoolName || ""}
                  onChange={(e) => setProfileData({...profileData, schoolName: e.target.value})}
                  placeholder="School where you teach"
                />
              </div>
              <div>
                <Label htmlFor="teachingGrades">Grades You Teach</Label>
                <Input
                  id="teachingGrades"
                  value={profileData.teachingGrades || ""}
                  onChange={(e) => setProfileData({...profileData, teachingGrades: e.target.value})}
                  placeholder="e.g., 9th, 10th, 11th"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileData.address || ""}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                placeholder="Your address"
              />
            </div>
          </>
        );
      case "school":
        return (
          <>
            <div>
              <Label htmlFor="ceoName">CEO/Principal Name</Label>
              <Input
                id="ceoName"
                value={profileData.ceoName || ""}
                onChange={(e) => setProfileData({...profileData, ceoName: e.target.value})}
                placeholder="Name of CEO or Principal"
              />
            </div>
            <div>
              <Label htmlFor="address">School Location</Label>
              <Input
                id="address"
                value={profileData.address || ""}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                placeholder="School address"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings | EduHub</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-screen">
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Profile Settings" />
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">Profile Settings</h1>
                
                <div className="mb-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.profilePicture || ""} alt={user?.fullName || "User"} />
                      <AvatarFallback className="text-xl">
                        {user?.fullName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-primary-500 text-white p-1 rounded-full cursor-pointer">
                      <i className="fas fa-camera"></i>
                      <input
                        type="file"
                        id="profile-picture"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        disabled={isUploading || isDemo}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-medium">{user?.fullName}</h2>
                    <p className="text-gray-500 capitalize">{user?.role}</p>
                    {isDemo && (
                      <p className="text-sm text-orange-500 mt-1">
                        <i className="fas fa-exclamation-circle mr-1"></i>
                        Demo mode - Profile updates disabled
                      </p>
                    )}
                  </div>
                </div>
                
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profile Information</TabsTrigger>
                    <TabsTrigger value="security">Password & Security</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Update your personal information and preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                value={profileData.fullName}
                                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                                placeholder="Your full name"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email Address</Label>
                              <Input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                placeholder="Your email address"
                                required
                                disabled
                              />
                              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              placeholder="Your phone number"
                              required
                            />
                          </div>
                          
                          {/* Role-specific fields */}
                          {renderRoleSpecificFields()}
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving || isDemo}>
                              {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="security">
                    <Card>
                      <CardHeader>
                        <CardTitle>Password & Security</CardTitle>
                        <CardDescription>
                          Manage your password and security preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              required
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button type="submit" disabled={isChangingPassword || isDemo}>
                              {isChangingPassword ? "Changing..." : "Change Password"}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </main>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-screen">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="text-xl font-bold font-['Poppins'] bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-900">
              EduHub
            </div>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profilePicture || ""} alt={user?.fullName || "User"} />
                  <AvatarFallback className="text-xl">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="mobile-profile-picture" className="absolute bottom-0 right-0 bg-primary-500 text-white p-1 rounded-full cursor-pointer">
                  <i className="fas fa-camera"></i>
                  <input
                    type="file"
                    id="mobile-profile-picture"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={isUploading || isDemo}
                  />
                </label>
              </div>
              <h2 className="text-lg font-medium">{user?.fullName}</h2>
              <p className="text-gray-500 capitalize">{user?.role}</p>
              {isDemo && (
                <p className="text-xs text-orange-500 mt-1">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  Demo mode - Profile updates disabled
                </p>
              )}
            </div>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardContent className="pt-4">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div>
                        <Label htmlFor="mobile-fullName">Full Name</Label>
                        <Input
                          id="mobile-fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-email">Email Address</Label>
                        <Input
                          id="mobile-email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          placeholder="Your email address"
                          required
                          disabled
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-phone">Phone Number</Label>
                        <Input
                          id="mobile-phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          placeholder="Your phone number"
                          required
                        />
                      </div>
                      
                      {/* Role-specific fields */}
                      {renderRoleSpecificFields()}
                      
                      <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isSaving || isDemo}>
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardContent className="pt-4">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <Label htmlFor="mobile-newPassword">New Password</Label>
                        <Input
                          id="mobile-newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile-confirmPassword">Confirm Password</Label>
                        <Input
                          id="mobile-confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                      
                      <div className="pt-2">
                        <Button type="submit" className="w-full" disabled={isChangingPassword || isDemo}>
                          {isChangingPassword ? "Changing..." : "Change Password"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
          
          {/* Bottom Navigation */}
          <MobileNavbar onCreatePost={() => {}} />
        </div>
      </div>
    </>
  );
}
