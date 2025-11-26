import React, { useEffect, useRef, memo } from 'react';

const EconomicCalendarWidget = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": "dark",
      "isTransparent": true,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "importanceFilter": "0,1",
      "currencyFilter": "USD,EUR,GBP,JPY,AUD,CAD,CHF,NZD,CNY"
    });

    container.current.appendChild(script);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
        <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Economic Calendar</h3>
        </div>
        <div className="flex-1 relative min-h-[200px]">
             <div className="tradingview-widget-container h-full w-full" ref={container}>
                <div className="tradingview-widget-container__widget"></div>
             </div>
        </div>
    </div>
  );
};

export default memo(EconomicCalendarWidget);