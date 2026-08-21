import Header from "@/components/Header";
export default function DashboardLayout({children}:{children:React.ReactNode}){return <><Header/><main className="mx-auto max-w-6xl px-5 py-10">{children}</main></>}
