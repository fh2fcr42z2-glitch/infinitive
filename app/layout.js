export const metadata = {
  title: "INFINITIVE Desk",
  description: "Ghost Desk paper book — not advice, not a registered fund"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
