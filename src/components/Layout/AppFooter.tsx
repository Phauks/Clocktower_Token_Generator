export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <p>Blood on the Clocktower Token Generator © {currentYear}</p>
    </footer>
  )
}
