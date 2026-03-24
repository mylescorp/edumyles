"use client";

export default function SubscribeForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log("Subscribe form submitted");
  };

  return (
    <form
      className="flex gap-3 flex-wrap sm:flex-nowrap justify-center"
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        placeholder="you@school.ac.ke"
        className="flex-1 min-w-0 border border-gray-200 rounded-[50px] px-5 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
        style={{ color: "#212121", minWidth: "220px" }}
      />
      <button
        type="submit"
        className="font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] flex-shrink-0"
        style={{ background: "#061A12", color: "#ffffff", border: "none", cursor: "pointer" }}
      >
        Subscribe
      </button>
    </form>
  );
}
