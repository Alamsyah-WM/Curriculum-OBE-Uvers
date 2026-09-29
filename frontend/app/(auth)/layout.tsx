import Login from "@/component/Login";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Login>
      {children}
    </Login>
  );
}
