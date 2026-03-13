"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith("/auth");

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    );
}
