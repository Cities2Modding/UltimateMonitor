import React from 'react';
import { useDataUpdate } from 'hookui-framework';

const $Stat = ({ label, value, diff, style, icon, iconStyle }) => {
    const textStyle = {
        color: '#FFFFFF', // Text color
        fontWeight: 'bold', // Optional: if you want bold text
        fontSize: '14rem',
        textShadow: '1rem 1rem 5rem rgba(0,0,0,1)',
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        height: "45rem"
    };

    const columnStyle = {
        flex: 1,
        width: '40%',
        textTransform: 'uppercase'
    };
    const column2Style = {
        flex: 1,
        width: '30%',
        textAlign: 'right',
        fontSize: '20rem'
    };
    const column3Style = {
        width: "30rem",
        fontSize: "13rem",
        textAlign: "right",
        fontWeight: "bold",
        color: diff == 0 ? "inherit" : diff > 0 ? "var(--negativeColor)" : "var(--positiveColor)"
    };
    return <div style={{ flex: 1, ...style, ...textStyle }}>
        <div style={columnStyle}>
            {label}
        </div>
        <div style={column2Style}>
            {value}
        </div>
        <div style={column3Style}>
            {diff === 0 ? null :diff}
        </div>
    </div>;
}

const panelStyle = {
    position: 'absolute',
    width: '300rem',
}

const $Panel = ({ title, children, react, plugin, style }) => {
    const [position, setPosition] = react.useState({ top: 100, left: 10 });
    const [dragging, setDragging] = react.useState(false);
    const [mouseOver, setMouseOver] = react.useState(false);
    const [rel, setRel] = react.useState({ x: 0, y: 0 }); // Position relative to the cursor
    
    useDataUpdate(react, plugin + ".windowPos", (pos) => {
        setPosition({ top: pos.y, left: pos.x });
    });

    const onMouseDown = (e) => {
        if (e.button !== 0) return; // Only left mouse button
        const panelElement = e.target.closest('.panel_YqS');

        // Calculate the initial relative position
        const rect = panelElement.getBoundingClientRect();
        setRel({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });

        setDragging(true);
        e.stopPropagation();
        e.preventDefault();
    }

    const onMouseUp = (e) => {
        setDragging(false);
        // Remove window event listeners when the mouse is released
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        engine.trigger("unemploymentInfo.saveConfig");

    }

    const onMouseMove = (e) => {
        if (!dragging)
            return;
        engine.trigger(plugin + ".updateWindow", e.clientX - rel.x, e.clientY - rel.y);
        e.stopPropagation();
        e.preventDefault();
    }

    const onMouseEnter = () => {
        setMouseOver(true);
    };

    const onMouseLeave = () => {
        setMouseOver(false);
    };

    const draggableStyle = {
        ...panelStyle,
        top: position.top + 'px',
        left: position.left + 'px',
    }

    react.useEffect(() => {
        if (dragging) {
            // Attach event listeners to window
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            // Clean up event listeners when the component unmounts or dragging is finished
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragging]); // Only re-run the effect if dragging state changes

    const mouseOverHeaderStyle = !mouseOver ? { opacity: 0 } : { opacity: 1 };

    return (
        <div className="panel_YqS" style={{ ...draggableStyle, width: 'auto', maxWidth: '300rem', ...style }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div className="header_H_U header_Bpo child-opacity-transition_nkS" style={{ ...mouseOverHeaderStyle, transition: 'opacity 0.5s easeOut', borderRadius: '20rem'  }}
                onMouseDown={onMouseDown}>
                <div className="title-bar_PF4">
                    <div className="title_SVH title_zQN">{title}</div>
                </div>
            </div>
            <div className="" style={{ background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {children}
            </div>
        </div>
    );
}

const engineEffect = (react, event, setFunc) => {
    const updateEvent = event + ".update"
    const subscribeEvent = event + ".subscribe"
    const unsubscribeEvent = event + ".unsubscribe"

    return react.useEffect(() => {
        var clear = engine.on(updateEvent, (data) => {
            //console.log(updateEvent, data)
            if (data.current !== undefined && data.min !== undefined && data.max !== undefined) {
                const percentage = ((data.current - data.min) / (data.max - data.min)) * 100;
                setFunc(percentage);
            } else {
                // console.warn(`${updateEvent} didn't have the expected properties`, data);
                setFunc(data);
            }
        })
        engine.trigger(subscribeEvent)
        return () => {
            engine.trigger(unsubscribeEvent)
            clear.clear();
        };
    }, [])
}

const $Progress = ({ react, percentage, text, minValue = 0, customColor = null, maxValue = 100, onMouseEnter, isReversed = false, hideShortLabel = false, showFullLabel = false, orientation = "vertical", icon = null }) => {
    function lerpColor(color1, color2, factor) {
        var result = color1.slice(1).match(/.{2}/g)
            .map((hexNum, index) => {
                // Convert hex to decimal
                const color1Value = parseInt(hexNum, 16);
                const color2Value = parseInt(color2.slice(1).match(/.{2}/g)[index], 16);
                // Interpolate between the two colors
                const interpolatedValue = Math.round(color1Value + (color2Value - color1Value) * factor);
                // Convert back to hex
                const hexResult = interpolatedValue.toString(16);
                return hexResult.padStart(2, '0');
            })
            .join('');
        return `#${result}`;
    }

    function calculateAdjustedFactor(percentage, minAcceptableValue = 0, maxAcceptableValue = 100) {
        let adjustedFactor;

        if (percentage <= minAcceptableValue) {
            // If the percentage is less than or equal to the minimum acceptable value,
            // we should not start the interpolation (i.e., the factor is 0).
            adjustedFactor = 0;
        } else if (percentage >= maxAcceptableValue) {
            // If the percentage is greater than or equal to the maximum acceptable value,
            // the factor should be 1, representing the positive color fully.
            adjustedFactor = 1;
        } else {
            // If the percentage is between the min and max acceptable values,
            // interpolate the factor between 0 and 1 based on where the percentage
            // falls within the range.
            adjustedFactor = (percentage - minAcceptableValue) / (maxAcceptableValue - minAcceptableValue);
        }

        return adjustedFactor;
    }
    function hexToRGBA(hex, alpha) {
        // Ensure the hex value includes the '#' character
        if (hex[0] !== '#') {
            hex = '#' + hex;
        }

        // Expand shorthand hex code to full form if needed
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }

        // Extract the red, green, and blue values
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        // Return the RGBA string
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function hexToHSL(hex) {
        // Convert hex to RGB first
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }

        // Then to HSL
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function darkenHex(hex, amount) {
        let { h, s, l } = hexToHSL(hex);

        l = Math.max(0, l - amount); // Clamp the lightness to not go below 0

        // Convert HSL back to hex
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0'); // Convert to Hex and force 2 digits
        };

        return `#${f(0)}${f(8)}${f(4)}`;
    }

    const rootStyle = getComputedStyle(document.documentElement);
    const negativeColor = rootStyle.getPropertyValue('--negativeColor').trim();
    const positiveColor = rootStyle.getPropertyValue('--positiveColor').trim();    

    const adjustedFactor = calculateAdjustedFactor(percentage, minValue, maxValue);
    const interpolatedColor = customColor ? customColor : lerpColor(isReversed ? negativeColor : positiveColor, isReversed ? positiveColor : negativeColor, adjustedFactor);

    const opacityOverride = hideShortLabel && !showFullLabel ? 0.75 : 1;

    const [showInternalLabel, setShowInternalLabel] = react.useState(false);

    const onMouseEnterFunc = () => {

        if (onMouseEnter)
            onMouseEnter();

        if (orientation === "horizontal")
            setShowInternalLabel(true);
        else
            setShowInternalLabel(false);            
    };

    const onMouseLeaveFunc = () => {
        setShowInternalLabel(false);
    };

    if (orientation === "vertical") {
        // Inline styles
        const containerStyle = {
            width: '20rem', // Width of the progress bar
            height: '150rem',
            flex: 1,
            backgroundColor: hexToRGBA(darkenHex(interpolatedColor, 20), 0.5 * opacityOverride), // Color of the empty part of the progress bar
            borderRadius: '20rem', // Optional: if you want rounded corners
            position: 'relative',
            display: 'flex',
            flexDirection: 'column-reverse', // To start filling from the bottom
            alignItems: 'center', // Center children horizontally
            border: `2rem solid ${showFullLabel ? 'rgba(255,255,255,0.8)' : hexToRGBA(interpolatedColor, 0.8 * opacityOverride)}`,
            boxShadow: 'rgba(0, 0, 0, 0.16) 0px 5rem 10rem',
            transition: 'border 0.5s easeOut, backgroundColor 0.5s easeOut',
        };

        const progressBarStyle = {
            backgroundColor: hexToRGBA(interpolatedColor, 0.8 * opacityOverride), // Color of the progress indicator
            width: '100%', // Full width of the container
            height: `${percentage}%`, // Height of the progress bar based on the percentage
            borderRadius: '20rem', // Optional: if you want rounded corners
            transition: 'height 0.5s easeOut, backgroundColor 0.5s easeOut',
        };

        const textStyle = {
            color: '#FFFFFF', // Text color
            fontWeight: 'bold', // Optional: if you want bold text
            fontSize: '11rem',
            textShadow: '1rem 1rem 5rem rgba(0,0,0,1)',
            opacity: opacityOverride,
            transition: 'opacity 0.5s easeOut',
        };

        return (
            <div style={{ width: '35rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onMouseEnter={onMouseEnterFunc} onMouseLeave={onMouseLeaveFunc}>
                <div style={{ ...textStyle, marginBottom: '10rem', fontSize: '14rem' }}>
                    {icon ? <img className="icon_HoD icon_soN icon_Iwk" src={icon}/> : !showFullLabel && !hideShortLabel ? text.substring(0, 2).toUpperCase() : <span>&nbsp;</span>}
                </div>
                <div style={containerStyle}>
                    <div style={progressBarStyle}></div>
                </div>
                <div style={{ ...textStyle, marginTop: '5rem'}}>{percentage + '%'}</div>
            </div>
        );
    }
    else {
        // Inline styles
        const containerStyle = {
            width: 'calc(270rem-48rem)', // Width of the progress bar
            height: '20rem',
            flex: 1,
            flexWrap: 'wrap',
            backgroundColor: hexToRGBA(darkenHex(interpolatedColor, 20), 0.5 * opacityOverride), // Color of the empty part of the progress bar
            borderRadius: '20rem', // Optional: if you want rounded corners
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center', // Center children horizontally
            border: `2rem solid ${showFullLabel ? 'rgba(255,255,255,0.8)' : hexToRGBA(interpolatedColor, 0.8 * opacityOverride)}`,
            boxShadow: 'rgba(0, 0, 0, 0.16) 0px 5rem 10rem',
            transition: 'border 0.5s easeOut, backgroundColor 0.5s easeOut',
        };

        const progressBarStyle = {
            backgroundColor: hexToRGBA(interpolatedColor, 0.8 * opacityOverride), // Color of the progress indicator
            width: `${percentage}%`, // Full width of the container
            height: '100%', // Height of the progress bar based on the percentage
            borderRadius: '20rem', // Optional: if you want rounded corners
            transition: 'height 0.5s easeOut, backgroundColor 0.5s easeOut',
        };

        const textStyle = {
            color: '#FFFFFF', // Text color
            fontWeight: 'bold', // Optional: if you want bold text
            fontSize: '11rem',
            width: '48rem',
            height: '100%',
            overflowX: 'hidden',
            textShadow: '1rem 1rem 5rem rgba(0,0,0,1)',
            opacity: opacityOverride,
            transition: 'opacity 0.5s easeOut',
        };
        const textStyle2 = {
            position: 'absolute',
            left: '0',
            top: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            textTransform: 'uppercase',
            justifyContent: 'center',
            color: '#FFFFFF', // Text color
            fontWeight: 'bold', // Optional: if you want bold text
            fontSize: '11rem',
            textShadow: '1rem 1rem 5rem rgba(0,0,0,1)',
            opacity: opacityOverride,
            transition: 'opacity 0.5s easeOut',
        };
        function formatNumber(number) {
            // Convert the number to a string
            let numStr = number.toString();

            // Find the index of the decimal point
            let decimalIndex = numStr.indexOf('.');

            // If there is no decimal point, return the original number string
            if (decimalIndex === -1 || parseFloat(parseInt(number)) == number) {
                return numStr;
            }

            // Calculate the end index for substring operation
            let endIndex = decimalIndex + 2; // Include decimal point and two decimal places

            // Use substring to get the string up to the desired number of decimal places
            // Also, check to ensure the string isn't shorter than the calculated endIndex
            let formattedStr = numStr.length > endIndex ? numStr.substring(0, endIndex) : numStr;

            return formattedStr;
        }

        const percentageText = formatNumber(parseFloat(percentage));
        return (
            <div style={{ position: 'relative', width: '100%', height: '20rem', display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '10rem' }} onMouseEnter={onMouseEnterFunc} onMouseLeave={onMouseLeaveFunc}>
                <div style={{ ...textStyle, fontSize: '14rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon ? <img className="icon_HoD icon_soN icon_Iwk" style={{ width: "32rem", height: "32rem" }} src={ icon }/> : !showFullLabel && !hideShortLabel ? text.substring(0, 2).toUpperCase() : <span>&nbsp;</span>}
                </div>
                <div style={containerStyle}>
                    <div style={progressBarStyle}></div>
                    {showInternalLabel ? <div style={textStyle2}>{text}</div> : <div style={textStyle2}>{percentageText + '%'}</div>}
                </div>
            </div>
        );
    }
};








// Used when max value (right) indicates that everything is OK ("Electricity Availability" for example)
const maxGood = 'linear-gradient(to right,rgba(255, 78, 24, 1.000000) 0.000000%, rgba(255, 78, 24, 1.000000) 40.000000%, rgba(255, 131, 27, 1.000000) 40.000000%, rgba(255, 131, 27, 1.000000) 50.000000%, rgba(99, 181, 6, 1.000000) 50.000000%, rgba(99, 181, 6, 1.000000) 60.000000%, rgba(71, 148, 54, 1.000000) 60.000000%, rgba(71, 148, 54, 1.000000) 100.000000%)'
// Used when min value (left) indicates everything is fine ("Fire Hazard" for example)
const minGood = 'linear-gradient(to right,rgba(71, 148, 54, 1.000000) 0.000000%, rgba(99, 181, 6, 1.000000) 5.000000%, rgba(255, 131, 27, 1.000000) 7.500000%, rgba(255, 78, 24, 1.000000) 10.000000%)'

const meterEventsToListenTo = [
    ["Total", "unemploymentInfo.unemploymentTotal", minGood],
    ["Uneducated", "unemploymentInfo.unemploymentEducation0", minGood],
    ["Poorly Educated", "unemploymentInfo.unemploymentEducation1", minGood],
    ["Educated", "unemploymentInfo.unemploymentEducation2", minGood],
    ["Well Educated", "unemploymentInfo.unemploymentEducation3", minGood],
    ["Highly Educated", "unemploymentInfo.unemploymentEducation4", minGood],
]

const labelEventsToListenTo = [
    ["Unemployed", "unemploymentInfo.unemployed"],
    ["Under Employed", "unemploymentInfo.underEmployed"],
    ["Homeless Households", "unemploymentInfo.homelessHouseholds"]
]

const $UnemploymentMonitor = ({ react }) => {
    const [hoveredItem, setHoveredItem] = react.useState('');

    const labels = labelEventsToListenTo.map(([label, eventName], index) => {
        const [read, set] = react.useState(-1);
        const [vector, setVector] = react.useState(0);
        const [diff, setDiff] = react.useState(0);
        engineEffect(react, eventName, set);
        engineEffect(react, `${eventName}Vector`, setVector);
        engineEffect(react, `${eventName}Diff`, setDiff);

        const icon = eventName === "unemploymentInfo.employable" ? "" : vector == 1 ? "Media/Glyphs/ThickStrokeArrowUp.svg" : vector == -1 ? "Media/Glyphs/ThickStrokeArrowDown.svg" : "";
        const iconStyle = eventName === "unemploymentInfo.employable" ? 0 : vector == 1 ? { backgroundColor: "var(--negativeColor)" } : vector == -1 ? { backgroundColor: "var(--positiveColor)" } : {};

        return <$Stat key={eventName} label={label} icon={icon} diff={diff} iconStyle={iconStyle} value={read} />;
    })

    const meters = meterEventsToListenTo.map(([label, eventName, gradient]) => {
        const [read, set] = react.useState(-1);
        engineEffect(react, eventName, set);
        //return <$Meter key={eventName} label={label} value={read} gradient={gradient} />
        const showFullLabel = hoveredItem === label;
        const hideShortLabel = hoveredItem !== '';
        const onMouseEnter = () => {
            setHoveredItem(label);
        };
        return <$Progress react={react} percentage={read} text={label} minValue="0" maxValue="40" color="#00ff43" hideShortLabel={hideShortLabel} showFullLabel={showFullLabel} onMouseEnter={onMouseEnter} />
    });

    const textStyle = {
        color: '#FFFFFF', // Text color
        fontWeight: 'bold', // Optional: if you want bold text
        fontSize: '14rem',
        textShadow: '1rem 1rem 5rem rgba(0,0,0,1)'
    };

    const onMouseLeave = () => {
        setHoveredItem('');
    };

    return <div>
        <$Panel title="Unemployment" react={react} plugin="unemploymentInfo" style={{ maxWidth: '200rem' }}>
            <div style={{ padding: '7.5rem', marginBottom: "10rem" }}>
                {labels}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: '5rem', position: 'relative', width: '200rem', overflowX: 'hidden' }} onMouseLeave={onMouseLeave}>
                {...meters}
                {hoveredItem !== '' ? <div style={{ ...textStyle, position: 'absolute', left: 0, top: '-2.5rem', width: '100%', whiteSpace: 'nowrap', textTransform: 'uppercase', textAlign: 'center' }}>
                    {hoveredItem}
                </div> : null}
            </div>
        </$Panel>
    </div>
};

window._$hookui.registerPanel({
    id: "cities2modding.unemploymentmonitor",
    name: "Unemployment Monitor",
    icon: "Media/Game/Icons/Workers.svg",
    component: $UnemploymentMonitor
});

const calculateAverage = (vals) => {
    let sum = 0;
    const values = Object.values(vals);

    // Loop through the values to sum them up
    for (let i = 0; i < values.length; i++) {
        sum += values[i];
    }

    // Divide by the length of eventNames to get the average
    return sum / values.length;
};

const $CityMonitor = ({ react }) => {
    const eventsToListenTo = [
        ['Electricity', 'electricityInfo.electricityAvailability', 'Media/Game/Icons/Electricity.svg', "#FFB80E", null],
        ['Water', 'waterInfo.waterAvailability', 'Media/Game/Icons/Water.svg', "#39C2FF", null],
        ['Sewage', 'waterInfo.sewageAvailability', 'Media/Game/Icons/Sewage.svg', "#997E62", null],
        ['Garbage Processing', 'garbageInfo.processingAvailability', 'Media/Game/Icons/Garbage.svg', "#31CF00", null],

        // TODO Crematorium
        ['Fire Hazard', 'fireAndRescueInfo.averageFireHazard', 'Media/Game/Icons/FireSafety.svg', null, null],
        ['Crime Rate', 'policeInfo.averageCrimeProbability', 'Media/Game/Notifications/CrimeScene.svg', "#255D95", null],
        ['Traffic Flow', 'trafficInfo.trafficFlow', 'Media/Game/Icons/TrafficLights.svg', "#808080", (flow) => {
            let total = 0;
            flow.forEach((val) => {
                total += val;
            });
            let avg = total / flow.length;
            return avg;
        }],
        ['Parking Availability', 'roadsInfo.parkingAvailability', 'Media/Game/Icons/Parking.svg', "#808080", null],
    ];
    const combinedEventsToListenTo = [
        ['Healthcare Efficiency', ['healthcareInfo.healthcareAvailability', 'healthcareInfo.averageHealth'], 'Media/Game/Icons/Healthcare.svg', "#E56333", calculateAverage],
        ['Deathcare Efficiency', ['healthcareInfo.cemeteryAvailability', 'healthcareInfo.deathcareAvailability'], 'Media/Game/Icons/Deathcare.svg', "#797979", calculateAverage],
        ['Imprisonment Capacity', ['policeInfo.jailAvailability', 'policeInfo.prisonAvailability'], 'Media/Game/Icons/Police.svg', "#FFB80E", calculateAverage],
        ['Education Availability', [
            'educationInfo.elementaryAvailability',
            'educationInfo.highSchoolAvailability',
            'educationInfo.collegeAvailability',
            'educationInfo.universityAvailability'
        ], 'Media/Game/Icons/Education.svg', "#61819C", calculateAverage],
        ['Income Efficiency', [
            'budget.totalIncome',
            'budget.totalExpenses',
        ], 'Media/Game/Icons/Money.svg', "#9ADF4B", (vals) => {
            const values = Object.values(vals);

            if (values.length != 2)
                return 0;

            var netIncome = values[0] + values[1];
            var percent = (netIncome / (values[0] + Math.abs(values[1]))) * 100;
            return percent;
        }],
        ['Monthly Population Growth', [
            'populationInfo.population',
            'populationInfo.birthRate',
            'populationInfo.movedIn',
            'populationInfo.deathRate',
            'populationInfo.movedAway'
        ], 'Media/Game/Icons/Population.svg', "#97B4BE", (vals) => {
            const values = Object.values(vals);

            if (values.length != 5)
                return 0;

            var positive = values[1] + values[2];
            var negative = values[3] + values[4];
            var percent = ((positive + negative) / values[0]) * 100;
            return percent;
        }],
        ['Avg. Pollution', [
            'pollutionInfo.averageGroundPollution',
            'pollutionInfo.averageWaterPollution',
            'pollutionInfo.averageAirPollution',
            'pollutionInfo.averageNoisePollution',
        ], 'Media/Game/Icons/GroundPollution.svg', "#9D662E", calculateAverage]
        // TODO Employment Rate
    ];
    const [hoveredItem, setHoveredItem] = react.useState('');
    
    const meters = eventsToListenTo.map(([label, eventName, icon, customColor, valueFunc]) => {
        const [read, set] = react.useState(-1);
        const update = (newVal) => {
            if (valueFunc)
                set(valueFunc(newVal));
            else
                set(newVal);
        };

        engineEffect(react, eventName, update);
        //return <$Meter key={eventName} label={label} value={read} gradient={gradient} />
        const showFullLabel = hoveredItem === label;
        const hideShortLabel = hoveredItem !== '';
        const onMouseEnter = () => {
            setHoveredItem(label);
        };

        return <$Progress react={react} customColor={customColor} icon={icon} isReversed="true" orientation="horizontal" percentage={read} text={label} minValue="50" maxValue="100" color="#00ff43" hideShortLabel={hideShortLabel} showFullLabel={showFullLabel} onMouseEnter={onMouseEnter} />
    });

    const [eventValues, setEventValues] = react.useState({});    
    
    const combinedMeters = combinedEventsToListenTo.map(([label, eventNames, icon, customColor, valuesFunc]) => {
            // Initialize state as an object to store values for each eventName
            // Effect to subscribe to events and update state
        const [read, set] = react.useState({});
        const [value, setValue] = react.useState(0);
        
        eventNames.map((eventName) => {
            const update = (newVal) => {
                set(prev => {
                    const newSet = { ...prev, [eventName]: newVal };
                    return newSet;
                });
                // Update setValue in a way that relies on the most current state
                // This might need adjustment based on what valuesFunc does and how it's used
                set(prev => {
                    setValue(valuesFunc(prev)); // Ensure valuesFunc can work correctly with the latest state
                    return prev; // Return the unchanged state if setValue is separate; adjust as needed
                });
            };
            engineEffect(react, eventName, update);
        });
           
                

            //return <$Meter key={eventName} label={label} value={read} gradient={gradient} />
            const showFullLabel = hoveredItem === label;
            const hideShortLabel = hoveredItem !== '';
            const onMouseEnter = () => {
                setHoveredItem(label);
            };

        return <$Progress key={label} react={react} customColor={customColor} icon={icon} isReversed="true" orientation="horizontal" percentage={value} text={label} minValue="50" maxValue="100" color="#00ff43" hideShortLabel={hideShortLabel} showFullLabel={showFullLabel} onMouseEnter={onMouseEnter} />
        });

    const textStyle = {
        color: '#FFFFFF', // Text color
        fontWeight: 'bold', // Optional: if you want bold text
        fontSize: '14rem',
        textShadow: '1rem 1rem 5rem rgba(0,0,0,1)'
    };

    const onMouseLeave = () => {
        setHoveredItem('');
    };

    return <div>
        <$Panel title="City" style={{ maxWidth: '270rem' }} react={react} plugin="citymonitor">
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5rem', position: 'relative' }} onMouseLeave={onMouseLeave}>
                {...meters}
                {combinedMeters ? combinedMeters : null}
            </div>
        </$Panel>
    </div>
};


window._$hookui.registerPanel({
    id: "cities2modding.citymonitor",
    name: "City Monitor",
    icon: "Media/Game/Icons/BuildingLevel.svg",
    component: $CityMonitor
});