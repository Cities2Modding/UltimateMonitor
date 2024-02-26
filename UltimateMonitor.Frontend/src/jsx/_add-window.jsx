import React from "react";

const AddWindow = ({ trigger, _L }) => {
    const react = window.$_gooee.react;
    const [windowName, setWindowName] = react.useState("");
    const { Button, Icon, Modal, FormGroup, TextBox } = window.$_gooee.framework;

    const onChangeName = (val) => {
        setWindowName(val);
    };

    const onAddWindow = () => {
        if (!windowName || windowName.length == 0)
            return;
        trigger("OnAddWindow", windowName);
    };

    const onCloseAddWindow = () => {
        trigger("OnToggleAddWindow");
    };

    return <div className="d-flex flex-row align-items-center justify-content-center w-100 h-100">
        <Modal title="Add Ultimate Monitor window" size="sm" onClose={onCloseAddWindow}>
            <FormGroup label="Name">
                <TextBox text={windowName} onChange={onChangeName} />
            </FormGroup>
            <Button onClick={onAddWindow} className="text-black d-inline" color="success" size="sm">
                <Icon className="mr-2" icon="solid-check" fa />
                <span>Save</span>
            </Button>
        </Modal>
    </div>;
};

export default AddWindow;