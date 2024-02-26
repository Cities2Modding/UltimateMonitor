import React from "react";
import { ReactId } from "reactjs-id";
import MonitorWindowContent from "./_monitor-window-content";

const MonitorWindow = ({ windowModel, windowIndex, visible, model,
    trigger, update, values, subValues, _L,
    onDragStart, onDragEnd, disableDrag }) => {
    const react = window.$_gooee.react;
    const [guid] = react.useState(ReactId());
    const { Button, Icon, ProgressBar, Modal, Container, MoveableModal, Scrollable, Dropdown, FormGroup } = window.$_gooee.framework;

    const [mouseOverModal, setMouseOverModal] = react.useState(false);
    const [editMode, setEditMode] = react.useState(false);
    
    react.useEffect(() => {
        const handleVisibilityChange = (event) => {
            if (event.detail.guid !== guid && editMode) {
                setEditMode(false);
            }
        };

        document.addEventListener("MonitorWindowEditMode", handleVisibilityChange);

        return () => {
            document.removeEventListener("MonitorWindowEditMode", handleVisibilityChange);
        };
    }, [editMode]);

    const closeModal = () => {
        trigger("OnToggleWindow", windowModel.Name);
        engine.trigger("audio.playSound", "close-panel", 1);
    };
    
    const toggleEdit = () => {
        const newValue = !editMode;

        if (newValue) {
            setMouseOverModal(false);
            const event = new CustomEvent("MonitorWindowEditMode", {
                detail: { guid }
            });
            document.dispatchEvent(event);
        }

        setEditMode(newValue);
    }
    
    const onMouseEnterModal = react.useCallback(() => {
        if (disableDrag)
            return;
        setMouseOverModal(true);
    }, [disableDrag]);

    const onMouseLeaveModal = react.useCallback(() => {
        if (disableDrag)
            return;
        setMouseOverModal(false);
    }, [disableDrag]);    

    const modalButtons = mouseOverModal ? <div className = "modal-buttons w-x d-inline" >
        <Button stopClickPropagation="true" size="sm"
            title={_L("UltimateMonitor.Edit")} description={_L("UltimateMonitor.Edit_desc")}
            circular={editMode ? null : true} icon={editMode ? null : true}
            style={editMode ? "trans" : "trans-faded"} onClick={toggleEdit}>
            <Icon icon="solid-pencil" fa />
        </Button>
    </div> : null;

    const onUpdateWindowPos = (pos) => {
        trigger("OnUpdateWindowPosition", JSON.stringify({
            windowName: windowModel.Name,
            x: parseInt(pos.x),
            y: parseInt(pos.y)
        }));
    };

    const onWindowRemoved = () => {
        setEditMode(false);
    };

    const renderModal = editMode ? <Modal title={`UM - ${windowModel.Name}`} bodyClassName="p-0" size="sm" fixed icon={modalButtons} onClose={toggleEdit}>
        <MonitorWindowContent windowIndex={windowIndex} model={model} windowModel={windowModel}
            values={values} subValues={subValues}
            onWindowRemoved={onWindowRemoved}
            editMode={editMode} toggleEdit={toggleEdit} _L={_L} trigger={trigger} />
    </Modal> : <MoveableModal className={(mouseOverModal ? "" : " modal-transparent")}
        onClose={closeModal} noClose={!mouseOverModal && !editMode}
        onMouseEnter={onMouseEnterModal} onMouseLeave={onMouseLeaveModal}
        pos={windowModel.Position}
        onStartDrag={() => onDragStart(windowModel.Name)}
        onEndDrag={() => onDragEnd()}
        onUpdateDrag={onUpdateWindowPos}
        disableDrag={disableDrag}
        icon={modalButtons} title={mouseOverModal && windowModel.Orientation !== "Vertical" ? windowModel.Name : null}>
        <MonitorWindowContent windowIndex={windowIndex} model={model} windowModel={windowModel}
            values={values} subValues={subValues}
            onWindowRemoved={onWindowRemoved}
            editMode={editMode} toggleEdit={toggleEdit} _L={_L} trigger={trigger} />
    </MoveableModal>;

    const renderBody = visible ? renderModal : null;

    return renderBody;
};

export default MonitorWindow;