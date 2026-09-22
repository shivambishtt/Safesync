export async function checkSession() {
  try {
    const response = await fetch("http://localhost:3000/api/users/get-data", {
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Session check failed:", error);
    return null;
  }
}
