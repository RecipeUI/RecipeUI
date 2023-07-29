export function Sidebar() {
  return (
    <div className="w-12 flex flex-col items-center py-2 border-r-2 border-black h-full space-y-2 bg-white">
      <SidebarLogo />
      <SidebarLogo />
    </div>
  );
}

function SidebarLogo() {
  return (
    <div className="w-8 h-8 border border-black rounded-md flex justify-center items-center"></div>
  );
}
