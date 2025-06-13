import { useState, useEffect } from "react";

export function TopBar({ ToggleSidebar }) {
  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="md:hidden flex justify-between items-center px-4 py-4 border-b border-gray-800 shadow-md bg-gray-900">
        <div className="text-2xl font-extrabold text-amber-400">Y</div>
        <div className="flex items-center gap-4">
          <button
            className="text-3xl text-amber-400 hover:text-amber-300 transition"
            onClick={ToggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ IsSidebarOpen, CloseSidebar, NavItems }) {
  return (
    <div
      className={`fixed top-0 left-0 z-40 h-full w-full bg-gray-900 border-r border-gray-800 transform md:hidden ${IsSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
    >
      <div className="flex justify-between items-center px-4 py-4 border-b border-gray-800">
        <div className="text-2xl font-extrabold text-amber-400">Y</div>
        <button
          className="text-3xl text-amber-400 hover:text-amber-300 transition-colors duration-200"
          onClick={CloseSidebar}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>
      <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-65px)]">{NavItems}</nav>
    </div>
  );
}


export function NavItems() {
  const [IsLightMode, SetIsLightMode] = useState(() => {
    return sessionStorage.getItem("LightMode") === "true";
  });

  useEffect(() => {
    const Body = document.body;

    if (IsLightMode) {
      Body.classList.add("light-mode");
    } else {
      Body.classList.remove("light-mode");
    }

    sessionStorage.setItem("LightMode", IsLightMode);
  }, [IsLightMode]);

  const NavigationItems = ['Home', 'Account'];

  return (
    <>
      <button
        onClick={() => SetIsLightMode(prev => !prev)}
        className="w-full text-center text-amber-400 hover:text-amber-300 transition px-3 py-1 border border-amber-400 rounded mb-4"
        aria-label="Toggle light mode"
      >
        {IsLightMode ? "Dark" : "Light"}
      </button>

      {NavigationItems.map(Item => (
        <ul key={Item}>
          <a
            href={Item}
            className="block px-4 py-2 rounded-lg text-gray-200 hover:bg-gray-800 hover:text-amber-400 transition"
          >
            {Item}
          </a>
        </ul>
      ))}
    </>
  );
}
