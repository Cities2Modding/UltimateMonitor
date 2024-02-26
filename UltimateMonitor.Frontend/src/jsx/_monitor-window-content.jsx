import React from "react";
import MonitorItem from "./_monitor-item";

const MonitorWindowContent = ({ model, windowModel, windowIndex, editMode, values, subValues,
    toggleEdit, _L, trigger, onWindowRemoved }) => {
    const react = window.$_gooee.react;
    const { Button, Icon, ProgressBar, Modal, Container, MoveableModal, Scrollable, Dropdown, FormGroup } = window.$_gooee.framework;
    const [selectedAddMonitor, setSelectedAddMonitor] = react.useState(null);

    const [hoveredItem, setHoveredItem] = react.useState(null);

    const onItemEnter = react.useCallback((item) => {
        setHoveredItem(item.Name);
        engine.trigger("audio.playSound", "hover-item", 1);
    }, []);

    const onItemLeave = react.useCallback(() => {
        setHoveredItem(null);
    }, []);

    const onSelectedAddMonitorChanged = react.useCallback((monitorName) => {
        setSelectedAddMonitor(monitorName);
    }, []);

    const onAddMonitor = react.useCallback(() => {
        if (!selectedAddMonitor || !windowModel)
            return;

        trigger("OnAddMonitor", JSON.stringify({
            WindowName: windowModel.Name,
            MonitorName: selectedAddMonitor
        }));
        setSelectedAddMonitor(null);
    }, [windowModel, trigger, selectedAddMonitor]);


    const onUpdateMonitorOrder = react.useCallback((monitorName, direction) => {
        if (!monitorName || !windowModel)
            return;
        trigger("OnUpdateMonitorOrder", JSON.stringify({
            WindowName: windowModel.Name,
            MonitorName: monitorName,
            Direction: direction
        }));
    }, [windowModel, trigger]);

    const onRemoveMonitor = react.useCallback((monitorName) => {
        if (!monitorName || !windowModel)
            return;

        trigger("OnRemoveMonitor", JSON.stringify({
            WindowName: windowModel.Name,
            MonitorName: monitorName
        }));
        
    }, [windowModel, trigger]);

    const onMoveMonitorUp = react.useCallback((monitorName) => {
        if (!monitorName || !windowModel)
            return;
        onUpdateMonitorOrder(monitorName, -1);
    }, [windowModel, trigger]);

    const onMoveMonitorDown = react.useCallback((monitorName) => {
        if (!monitorName)
            return;
        onUpdateMonitorOrder(monitorName, 1);
    }, [windowModel, trigger]); 
    
    const addMonitorOptions = react.useMemo(() => {
        const items = !model.Items || !windowModel.Monitors ? null : model.Items.filter(i => windowModel.Monitors.filter(m => m.MonitorItemName === i.Name).length === 0);

        let options = [];

        if (!items)
            return options;

        items.forEach(item => {
            options.push({
                label: _L(`UltimateMonitor.Monitor.${item.Name}`),
                value: item.Name
            });
        });

        return options.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
    }, [model.Items, windowModel.Monitors]);

    const removeWindow = () => {
        if (onWindowRemoved)
            onWindowRemoved();
        trigger("OnRemoveWindow", windowModel.Name);
    };

    const sizeOptions = [
        {
            label: _L("UltimateMonitor.Size.ExtraSmall"),
            value: "ExtraSmall"
        },
        {
            label: _L("UltimateMonitor.Size.Small"),
            value: "Small"
        },
        {
            label: _L("UltimateMonitor.Size.Medium"),
            value: "Medium"
        },
        {
            label: _L("UltimateMonitor.Size.Large"),
            value: "Large"
        }];

    const widthSizeClassName = editMode ? "vw-25" : windowModel.Orientation === "Horizontal" ? (windowModel.Size === "ExtraSmall" ? "vw-10" : windowModel.Size === "Small" ? "vw-15" : windowModel.Size === "Large" ? "vw-30" : "vw-20") : "w-x";
    const heightSizeClassName = editMode ? "" : windowModel.Orientation === "Vertical" ? (windowModel.Size === "ExtraSmall" ? "vh-15" : windowModel.Size === "Small" ? "vh-20" : windowModel.Size === "Large" ? "vh-40" : "vh-25") : "";
    
    const renderProgressBars = react.useMemo(() => {
        if (!model.Items || !windowModel.Monitors)
            return null;
        return <>{windowModel.Monitors.sort((a, b) => a.Order - b.Order).map((monitorDisplay, index) => <MonitorItem key={index} model={model} windowModel={windowModel}
            values={values}
            editMode={editMode} _L={_L} hoveredItem={hoveredItem}
            monitorDisplay={monitorDisplay} index={index}
            onItemEnter={onItemEnter} onItemLeave={onItemLeave}
            onRemoveMonitor={onRemoveMonitor} onMoveMonitorUp={onMoveMonitorUp}
            onMoveMonitorDown={onMoveMonitorDown} />)}</>;
    }, [model.Items, values, subValues, hoveredItem, editMode, windowModel.Monitors]);
    
    const modalContent = <div className={`${widthSizeClassName} ${heightSizeClassName}`} style={windowModel.Orientation === "Vertical" ? { minWidth: "48rem" } : null}>
        {!windowModel.Monitors || windowModel.Monitors.length == 0 ?
            <div>
                <div className="alert d-flex flex-row align-items-center alert-danger" onClick={toggleEdit}>
                    <Icon className="mr-4" icon="solid-face-frown" size="lg" fa />
                    <div className="flex-1 ml-x w-x">
                        <h5 className="mb-0">{_L("UltimateMonitor.NoMonitors")}</h5>
                        <p cohinline="cohinline" className="d-inline">
                            {_L("UltimateMonitor.NoMonitors_desc")}
                        </p>
                    </div>
                </div>
            </div> : <div className={`progress-bar-group ${windowModel.Orientation.toLowerCase()}`}>
                {renderProgressBars}
            </div>}
    </div>;

    const onSelectOrientation = react.useCallback((orientation) => {
        windowModel.Orientation = orientation;
        model.Windows[windowIndex].Orientation = orientation;
        trigger("OnUpdateMonitorWindow", JSON.stringify({ "WindowName": windowModel.Name, "Orientation": orientation }));
    }, [windowModel, model.Windows]);

    const onSelectSize = react.useCallback((size) => {
        windowModel.Size = size;
        model.Windows[windowIndex].Size = size;
        trigger("OnUpdateMonitorWindow", JSON.stringify({ "WindowName": windowModel.Name, "Size": size }));
    }, [windowModel, model.Windows]);

    const editModalContent = <>
        <div className="d-flex flex-row p-2 align-items-center bg-section-dark">
            <Container className="w-x"
                title={_L(`UltimateMonitor.${windowModel.Orientation}.Size`)} description={_L(`UltimateMonitor.${windowModel.Orientation}.Size_desc`)}>
                <Icon className="mr-2 bg-muted" icon={windowModel.Orientation === "Horizontal" ? "solid-left-right" : "solid-up-down"} fa />
            </Container>
            <Dropdown selected={windowModel.Size} options={sizeOptions} size="sm" className="w-25 mr-2"
                toggleClassName="bg-dark-trans-less-faded" onSelectionChanged={onSelectSize} />
            <div className="btn-group w-x ml-x">
                <Button color={windowModel.Orientation === "Horizontal" ? "primary" : "dark"}
                    title={_L("UltimateMonitor.Horizontal")} description={_L("UltimateMonitor.Horizontal_desc")}
                    style="trans" size="xs" onClick={() => onSelectOrientation("Horizontal")}>
                    <Icon icon="solid-ruler-horizontal" fa />
                </Button>
                <Button color={windowModel.Orientation === "Vertical" ? "primary" : "dark"}
                    title={_L("UltimateMonitor.Vertical")} description={_L("UltimateMonitor.Vertical_desc")}
                    style="trans" size="xs" onClick={() => onSelectOrientation("Vertical")}>
                    <Icon icon="solid-ruler-vertical" fa />
                </Button>
            </div>
            <Dropdown selected={selectedAddMonitor} options={addMonitorOptions} size="sm" className="flex-1 ml-2 mr-2"
                toggleClassName="bg-dark-trans-less-faded" onSelectionChanged={onSelectedAddMonitorChanged} />
            <div className="btn-group w-x ml-x">
                <Button color="primary" style="trans" size="xs"
                    title={_L("UltimateMonitor.Add")} description={_L("UltimateMonitor.Add_desc")}
                    onClick={onAddMonitor} disabled={selectedAddMonitor == null}>
                    <Icon icon="solid-plus" fa />
                </Button>
            </div>
        </div>
        {!windowModel.Monitors || windowModel.Monitors.length == 0 ?
            <div className="p-4 flex-1">
                <div className="alert d-flex flex-row align-items-center alert-info">
                    <Icon className="mr-4" icon="solid-circle-info" size="lg" fa />
                    <div className="flex-1 ml-x">
                        <h5 className="mb-0">{_L("UltimateMonitor.NoMonitorsEdit")}</h5>
                        <p cohinline="cohinline" className="d-inline">
                            {_L("UltimateMonitor.NoMonitorsEdit_desc")}
                        </p>
                    </div>
                </div>
            </div> : <Scrollable className="h-x flex-1">
                <div className="progress-bar-group horizontal">
                    {renderProgressBars}
                </div>
            </Scrollable>}
        <div className="d-flex flex-row justify-content-end align-items-center bg-section-dark p-4 mt-2">
            {windowModel.Name !== "Default" ? <Button className="mr-1" stopClickPropagation="true" color="danger" size="xs"
                title={_L("UltimateMonitor.RemoveWindow")} description={_L("UltimateMonitor.RemoveWindow_desc")}
                circular={true} style={"trans"} onClick={removeWindow}>
                <Icon className="bg-white" icon="solid-trash" fa />
                <span className="text-white ml-2 text-uppercase">{_L("UltimateMonitor.RemoveWindow")}</span>
            </Button> : null}
            <Button stopClickPropagation="true" color="success" size="xs" title={_L("UltimateMonitor.Done")} description={_L("UltimateMonitor.Done_desc")} style="trans" onClick={toggleEdit}>
                <Icon className="bg-white" icon="solid-check" fa />
                <span className="text-white ml-2 text-uppercase">{_L("UltimateMonitor.Done")}</span>
            </Button>
        </div>
    </>;

    return editMode ? editModalContent : modalContent;
};

export default MonitorWindowContent;