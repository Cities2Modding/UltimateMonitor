import React from "react";
import MonitorWindow from "./_monitor-window";
import AddWindow from "./_add-window";

const ToolWindow = ({ react, setupController }) => {
    const { model, update, trigger, _L } = setupController();
    const [values, setValues] = react.useState({});
    const [subValues, setSubValues] = react.useState({});
    const [draggingWindow, setDraggingWindow] = react.useState(null);

    const onDragStart = (windowName) => {
        setDraggingWindow(windowName);
    };

    const onDragEnd = () => {
        setDraggingWindow(null);
    };

    const builtIn = react.useMemo(() => {
        return {
            sum: (vals) => {
                const values = Object.values(vals);
                return values.reduce((acc, curr) => acc + curr, 0);
            },
            average: (vals) => {
                const values = Object.values(vals);
                const sum = values.reduce((acc, curr) => acc + curr, 0);
                return sum / values.length;
            },
            median: (vals) => {
                const values = Object.values(vals).sort((a, b) => a - b);
                const mid = Math.floor(values.length / 2);
                return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
            },
            min: (vals) => {
                const values = Object.values(vals);
                return Math.min(...values);
            },
            max: (vals) => {
                const values = Object.values(vals);
                return Math.max(...values);
            },
            variance: (vals) => {
                const values = Object.values(vals);
                const mean = builtIn.average(vals);
                return values.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / values.length;
            },
            standardDeviation: (vals) => {
                const variance = builtIn.variance(vals);
                return Math.sqrt(variance);
            },
            custom: (name) => {
                switch (name) {
                    case "IncomeEfficiency":
                        return (vals) => {
                            if (!vals || Object.keys(vals).length != 2)
                                return 0;
                            const totalExpenses = vals["budget.totalExpenses"];
                            const totalIncome = vals["budget.totalIncome"];
                            const netIncome = totalIncome + totalExpenses;
                            const percent = (netIncome / (totalIncome + Math.abs(totalExpenses)));
                            return percent;
                        };

                    case "MonthlyPopulationGrowth":
                        return (vals) => {
                            if (!vals || Object.keys(vals).length != 5)
                                return 0;

                            const population = vals["populationInfo.population"];
                            const birthRate = vals["populationInfo.birthRate"];
                            const movedIn = vals["populationInfo.movedIn"];
                            const movedAway = vals["populationInfo.movedAway"];
                            const deathRate = vals["populationInfo.deathRate"];
                            const positive = birthRate + movedIn;
                            const negative = deathRate + movedAway;
                            const percent = ((positive + negative) / population);
                            return percent;
                        };

                    case "TrafficFlow":
                        return (vals) => {
                            if (!vals || Object.keys(vals).length != 1)
                                return 0;

                            const trafficFlow = vals["trafficInfo.trafficFlow"];
                            let total = 0;
                            if (trafficFlow && trafficFlow.length > 0) {
                                trafficFlow.forEach((val) => {
                                    total += val;
                                });
                            }
                            return trafficFlow ? (total / trafficFlow.length) / 100.0 : 0;
                        };
                }

                console.warn(`No custom handler for ${name}!`);
                return (vals) => { };
            }
        };
    }, []);

    const runValueFunc = (liveValues, item) => {
        let values = {};

        if (item.ValueSubscriptions && item.ValueSubscriptions.length > 0) {
            item.ValueSubscriptions.forEach(sub => {
                const val = liveValues[sub];
                values[sub] = val;
            });
        }
        
        let value;
        if (Object.keys(values).length > 0) {
            const operation = item.ValueOperation;

            switch (operation) {
                case "Average":
                    value = builtIn.average(values) / 100.0;
                    break;

                case "Median":
                    value = builtIn.median(values) / 100.0;
                    break;

                case "Sum":
                    value = builtIn.sum(values) / 100.0;
                    break;

                case "Min":
                    value = builtIn.min(values) / 100.0;
                    break;

                case "Max":
                    value = builtIn.max(values) / 100.0;
                    break;

                case "Variance":
                    value = builtIn.variance(values) / 100.0;
                    break;

                case "StandardDeviation":
                    value = builtIn.standardDeviation(values) / 100.0;
                    break;

                case "Custom":
                    var func = builtIn.custom(item.Name);

                    if (func) {
                        value = func(values);
                    }
                    break;

                case "None":
                    if (values && item.ValueSubscriptions)
                        value = item.Type !== "Raw" ? values[item.ValueSubscriptions[0]] / 100.0 : values[item.ValueSubscriptions[0]];
                    break;
            }
        }        
        return isNaN(value) ? 0 : value;
    };

    const setSubValueFunc = (item, key, data) => {
        setSubValues(prevSubValues => {
            return { ...prevSubValues, [key]: data };
        });
    };

    react.useEffect(() => {
        if (!subValues || !model.Items || model.Items && model.Items.length == 0)
            return;

        let newValues = values;

        model.Items.forEach(item => {
            const calculatedValue = runValueFunc(subValues, item);
            newValues[item.Name] = calculatedValue;
        });

        setValues(newValues);
    }, [subValues, model.Items]);

    react.useEffect(() => {
        let subscriptions = [];
        if (model.Items && model.Items.length > 0) {
            model.Items.forEach(item => {
                item.ValueSubscriptions.forEach(sub => {
                    const updateEvent = `${sub}.update`;
                    const subscribeEvent = `${sub}.subscribe`;
                    let engineSub = engine.on(updateEvent, (data) => {                        
                        if (data.current !== undefined && data.min !== undefined && data.max !== undefined) {
                            const percentage = ((data.current - data.min) / (data.max - data.min)) * 100;
                            setSubValueFunc(item, sub, percentage);
                        }
                        else {
                            setSubValueFunc(item, sub, data);
                        }
                    })
                    subscriptions.push(engineSub);
                    engine.trigger(subscribeEvent);
                });
            });
        }
        return () => {
            if (model.Items && model.Items.length > 0) {
                model.Items.forEach(item => {
                    if (item.ValueSubscriptions && item.ValueSubscriptions.length > 0) {
                        item.ValueSubscriptions.forEach(sub => {
                            const unsubscribeEvent = `${sub}.unsubscribe`;
                            engine.trigger(unsubscribeEvent);
                        });
                    }
                });
            }

            if (subscriptions && subscriptions.length > 0) {
                subscriptions.forEach(engineSub => {
                    engineSub.clear();
                });
            }
        };
    }, [model.Items, setSubValues]);        

    const renderMonitor = (windowModel, index) => {
        return windowModel && windowModel.IsVisible ? <MonitorWindow disableDrag={draggingWindow && draggingWindow !== windowModel.Name} onDragStart={onDragStart} onDragEnd={onDragEnd} visible={true} key={index} windowModel={windowModel} windowIndex={index} model={model} values={values} _L={_L} subValues={subValues} trigger={trigger} update={update} /> : null;
    };

    return <>
        {model.Windows ? model.Windows.map((windowModel, index) => renderMonitor(windowModel, index)) : null}
        {model.ShowAddWindow ? <AddWindow model={model} trigger={trigger} _L={_L} /> : null}
    </>;
};

window.$_gooee.register("ultimatemonitor", "UltimateMonitorWindow", ToolWindow, "main-container", "ultimatemonitor");
