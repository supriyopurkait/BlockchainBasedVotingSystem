import React from "react";
import HeroText from "./heroText.jsx"; // Import Detailsdata
import VoteBtn from "./voteBtn.jsx";

export default function Home({ connected }) {
  return (
    <>
      <div className="home content ms-2 font-mono">
        <HeroText /> {/* Use Detailsdata after importing */}
        <div
          className="d-flex gap-14 ms-[10rem]"
        >
          {connected && <VoteBtn />} {/* Show VoteBtn only if connected */}
          <button type="button" className="justify-center bg-slate-600 text-white hover:bg-slate-50 hover:text-black hover:border-black hover:border-[1px]">
            Know more
          </button>
        </div>
      </div>
    </>
  );
}