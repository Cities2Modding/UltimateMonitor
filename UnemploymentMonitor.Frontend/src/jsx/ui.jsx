import React from 'react';
import { useDataUpdate } from 'hookui-framework';

const $Label = ({ label, value, style }) => {
    const textStyle = {
        color: '#FFFFFF', // Text color
        fontWeight: 'bold', // Optional: if you want bold text
        fontSize: '14rem',
        textShadow: '1rem 1rem 5rem rgba(0,0,0,1)',
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center'
    };

    const columnStyle = {
        flex: 1,
        width: '70%',
        textTransform: 'uppercase'
    };
    const column2Style = {
        flex: 1,
        width: '30%',
        textAlign: 'right',
        fontSize: '20rem'
    };
    return <div style={{...style, ...textStyle}}>
        <div style={columnStyle}>
            {label}
        </div>
        <div style={column2Style}>
            {value}
        </div>
    </div>
}

const panelStyle = {
    position: 'absolute',
    width: '300rem',
}

const $Panel = ({ title, children, react }) => {
    const [position, setPosition] = react.useState({ top: 100, left: 10 });
    const [dragging, setDragging] = react.useState(false);
    const [mouseOver, setMouseOver] = react.useState(false);
    const [rel, setRel] = react.useState({ x: 0, y: 0 }); // Position relative to the cursor
    
    useDataUpdate(react, "unemploymentInfo.windowPos", (pos) => {
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
        engine.trigger("unemploymentInfo.updateWindow", e.clientX - rel.x, e.clientY - rel.y);
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
        <div className="panel_YqS" style={{ ...draggableStyle, width: 'auto' }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div className="header_H_U header_Bpo child-opacity-transition_nkS" style={{ ...mouseOverHeaderStyle, transition: 'opacity 0.5s easeOut', borderRadius: '20rem'  }}
                onMouseDown={onMouseDown}>
                <div className="title-bar_PF4">
                    <div className="title_SVH title_zQN">{title}</div>
                </div>
            </div>
            <div className="" style={{ background: 'none' }}>
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

const $Progress = ({ percentage, text, minValue = 0, maxValue = 100, onMouseEnter, hideShortLabel = false, showFullLabel = false }) => {
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
    const interpolatedColor = lerpColor(positiveColor, negativeColor, adjustedFactor);

    const opacityOverride = hideShortLabel && !showFullLabel ? 0.75 : 1;

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
        <div style={{ width: '35rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onMouseEnter={onMouseEnter}>
            <div style={{ ...textStyle, marginBottom: '10rem', fontSize: '14rem' }}>
                {!showFullLabel && !hideShortLabel ? text.substring(0, 2).toUpperCase() : <span>&nbsp;</span>}
            </div>
            <div style={containerStyle}>
                <div style={progressBarStyle}></div>
            </div>
            <div style={{ ...textStyle, marginTop: '5rem'}}>{percentage + '%'}</div>
        </div>
    );
};








// Used when max value (right) indicates that everything is OK ("Electricity Availability" for example)
const maxGood = 'linear-gradient(to right,rgba(255, 78, 24, 1.000000) 0.000000%, rgba(255, 78, 24, 1.000000) 40.000000%, rgba(255, 131, 27, 1.000000) 40.000000%, rgba(255, 131, 27, 1.000000) 50.000000%, rgba(99, 181, 6, 1.000000) 50.000000%, rgba(99, 181, 6, 1.000000) 60.000000%, rgba(71, 148, 54, 1.000000) 60.000000%, rgba(71, 148, 54, 1.000000) 100.000000%)'
// Used when min value (left) indicates everything is fine ("Fire Hazard" for example)
const minGood = 'linear-gradient(to right,rgba(71, 148, 54, 1.000000) 0.000000%, rgba(99, 181, 6, 1.000000) 5.000000%, rgba(255, 131, 27, 1.000000) 7.500000%, rgba(255, 78, 24, 1.000000) 10.000000%)'

const meterEventsToListenTo = [
    ['Total', 'unemploymentInfo.unemploymentTotal', minGood],
    ['Uneducated', 'unemploymentInfo.unemploymentEducation0', minGood],
    ['Poorly Educated', 'unemploymentInfo.unemploymentEducation1', minGood],
    ['Educated', 'unemploymentInfo.unemploymentEducation2', minGood],
    ['Well Educated', 'unemploymentInfo.unemploymentEducation3', minGood],
    ['Highly Educated', 'unemploymentInfo.unemploymentEducation4', minGood],
]

const labelEventsToListenTo = [
    ['Unemployed', 'unemploymentInfo.underemployedCimsCount'],
    ['Homeless Households', 'unemploymentInfo.homelessHouseholdCount']
]

const $CityMonitor = ({ react }) => {
    const [hoveredItem, setHoveredItem] = react.useState('');

    const labels = labelEventsToListenTo.map(([label, eventName], index) => {
        const [read, set] = react.useState(-1)
        engineEffect(react, eventName, set)

        const style = index > 0 ? { marginTop: '5rem' } : null;
        return <$Label key={eventName} label={label} value={read} style={style} />
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
        return <$Progress percentage={read} text={label} minValue="0" maxValue="40" color="#00ff43" hideShortLabel={hideShortLabel} showFullLabel={showFullLabel} onMouseEnter={onMouseEnter} />
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
        <$Panel title="Unemployment" react={react}>
            <div style={{ padding: '7.5rem' }}>
                {labels}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: '5rem', position: 'relative' }} onMouseLeave={onMouseLeave}>
                {...meters}
                {hoveredItem !== '' ? <div style={{ ...textStyle, position: 'absolute', left: 0, top: '-2.5rem', width: '100%', whiteSpace: 'nowrap', textTransform: 'uppercase', textAlign: 'center' }}>
                    {hoveredItem}
                </div> : null}
            </div>
        </$Panel>
    </div>
}

window._$hookui.registerPanel({
    id: "cities2modding.unemploymentmonitor",
    name: "Unemployment Monitor",
    icon: "Media/Game/Icons/Workers.svg",
    component: $CityMonitor
});