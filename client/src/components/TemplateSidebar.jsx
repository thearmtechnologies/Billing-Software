import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";

const templates = [
  { id: "template1", name: "Template 1" },
  { id: "template2", name: "Template 2" },
  { id: "template3", name: "Template 3" },
  { id: "template4", name: "Template 4" },
  { id: "template5", name: "Template 5" },
  { id: "template6", name: "Template 6" },
];

const TemplateSidebar = ({
  selectedTemplate,
  setSelectedTemplate,
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          key="sidebar"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-y-0 right-0 z-50 lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] 
            bg-black/70 backdrop-blur-md border-l border-gray-700 flex flex-col shadow-xl
            w-64 sm:w-68 md:w-70 lg:w-74"
        >
          {/* Header */}
          <div
            className="border-b border-gray-600 flex-shrink-0 flex justify-between items-center bg-black/50"
            style={{ paddingLeft: "1rem", paddingRight: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem" }}
          >
            <h3
              className="font-semibold text-white text-lg md:text-xl"
              style={{ marginBottom: 0 }}
            >
              Choose Template
            </h3>

            {/* Close button with tooltip */}
            <div className="relative group">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden bg-gray-200 text-blue-700 rounded-full hover:bg-gray-300 transition cursor-pointer"
                style={{ padding: "0.5rem" }}
              >
                <ChevronRight size={18} />
              </button>
              <span
                className="absolute right-full top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap"
                style={{ marginRight: "0.5rem", paddingTop: "0.25rem", paddingBottom: "0.25rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
              >
                Hide Templates
              </span>
            </div>
          </div>

          {/* Templates - Scrollable Area */}
          <div className="flex-1 overflow-y-auto">
            <ul
              className="flex flex-col"
              style={{ padding: "1rem", gap: "0.75rem" }}
            >
              {templates.map((tpl) => (
                <li
                  key={tpl.id}
                  className={`rounded cursor-pointer transition-all duration-200 relative ${
                    selectedTemplate === tpl.id
                      ? "border-2 border-blue-500 bg-blue-50"
                      : "border border-gray-400 bg-white hover:shadow-md"
                  }`}
                  style={{ padding: "0.75rem" }}
                  onClick={() => setSelectedTemplate(tpl.id)}
                >
                  <p
                    className="text-sm md:text-base font-medium"
                    style={{ marginBottom: "0.5rem" }}
                  >
                    {tpl.name}
                  </p>
                  <div
                    className="bg-gray-200 flex items-center justify-center text-xs md:text-sm text-gray-600 rounded"
                    style={{ height: "5rem" }}
                  >
                    Preview
                  </div>

                  {/* Checkmark for active template */}
                  {selectedTemplate === tpl.id && (
                    <span className="absolute top-2 right-2 text-blue-600">
                      <Check size={16} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TemplateSidebar;