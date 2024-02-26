import React from "react";
import RawStat from "./_raw-stat";

const MonitorItem = ({ model, windowModel, editMode,
    values,
    monitorDisplay, index, _L, hoveredItem,
    onItemEnter, onItemLeave,
    onRemoveMonitor, onMoveMonitorUp, onMoveMonitorDown }) => {
    const react = window.$_gooee.react;
    const { Button, Icon, ProgressBar, Modal, Container, MoveableModal, Scrollable, Dropdown, FormGroup } = window.$_gooee.framework;

    if (!model || !model.Items)
        return;

    const items = model.Items.filter(i => i.Name === monitorDisplay.MonitorItemName);

    if (!items || items.length !== 1)
        return null;

    const item = items[0];

    if (!item)
        return null;

    const value = values[item.Name] ? values[item.Name] : 0;
    const isHovered = hoveredItem === item.Name;
    const isVerticalMode = !editMode && windowModel.Orientation === "Vertical";

    const itemElement = <Container className={"d-flex" + (isVerticalMode ? " flex-column w-x h-100 align-items-center justify-content-center mr-2" : " flex-row")}
        title={_L(`UltimateMonitor.Monitor.${item.Name}`)} description={_L(`UltimateMonitor.Monitor.${item.Name}_desc`)}
        toolTipFloat={windowModel.Orientation === "Vertical" ? "left" : "down"} toolTipAlign={windowModel.Orientation === "Vertical" ? "center" : "center"}>
        <Icon style={isVerticalMode ? { marginLeft: "-2.5rem" } : null} icon={item.Icon} size={editMode ? "lg" : null} />
        {editMode ? <h6 className="ml-4 mb-0">{_L(`UltimateMonitor.Monitor.${item.Name}`)}</h6> : null}
        {editMode ? <div className="d-flex flex-row flex-1 ml-2 justify-content-end align-items-center">
            <Button circular border icon style="trans-faded"
                title={_L("UltimateMonitor.Remove")} description={_L("UltimateMonitor.Remove_desc")}
                onClick={() => onRemoveMonitor(monitorDisplay.MonitorItemName)}>
                <Icon className="bg-danger" icon="solid-minus" fa />
            </Button>
            <Button className="ml-2" circular border icon style="trans-faded"
                title={_L("UltimateMonitor.MoveUp")} description={_L("UltimateMonitor.MoveUp_desc")}
                onClick={() => onMoveMonitorUp(monitorDisplay.MonitorItemName)}
                disabled={monitorDisplay.Order === 0}>
                <Icon icon="solid-chevron-up" fa />
            </Button>
            <Button className="ml-2" circular border icon style="trans-faded"
                title={_L("UltimateMonitor.MoveDown")} description={_L("UltimateMonitor.MoveDown_desc")}
                onClick={() => onMoveMonitorDown(monitorDisplay.MonitorItemName)}
                disabled={monitorDisplay.Order === windowModel.Monitors.length - 1}>
                <Icon icon="solid-chevron-down" fa />
            </Button>
        </div> : item.Type === "ProgressBar" ? <ProgressBar className={!isVerticalMode ? "flex-1 ml-2" : "flex-1 mt-1"}
            value={value} orientation={windowModel.Orientation.toLowerCase()} color={item.Colour} /> :
            <RawStat orientation={windowModel.Orientation.toLowerCase()} value={value} />}

    </Container>;

    return <div className={(editMode && isHovered ? "bg-primary-trans-less-faded rounded-sm p-2 border-bottom-transparent" : editMode ? "border-bottom p-2" : index !== windowModel.Monitors.length - 1 && !isVerticalMode ? "mb-2" : "") + (isVerticalMode ? " w-x" : " flex-1")}
        key={index}
        onMouseEnter={() => onItemEnter(item)} onMouseLeave={() => onItemLeave()}>
        {itemElement}
    </div>;
};

export default MonitorItem;