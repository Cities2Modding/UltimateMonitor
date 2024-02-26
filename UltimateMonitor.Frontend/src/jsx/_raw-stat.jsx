import React from "react";

const RawStat = ({ value, orientation }) => {
    const react = window.$_gooee.react;
   
    function formatNumber(number) {
        var parts = number.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }
    
    return <div className={"d-flex flex-row align-items-center justify-content-center flex-1 " +
        (orientation === "vertical" ? "" : "pr-4")} style={orientation === "vertical" ? { minWidth: '45rem' } : null}>
        <strong className="">{formatNumber(parseInt(value))}</strong>        
    </div>;
};

export default RawStat;