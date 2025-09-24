
import { auth } from "@/lib/auth";
import { LoginForm } from "./_components/LoginForm";
import { headers } from "next/headers";

export default async function LoginPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return <LoginForm />;
}