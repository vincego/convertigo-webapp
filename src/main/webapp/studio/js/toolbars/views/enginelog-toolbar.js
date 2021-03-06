function EngineLogToolbar(container, engineLogView) {
    Toolbar.call(this, container, "enginelog-action");

    // Go to top
    this.addAction(
        "go-to-top-action",
        Convertigo.createServiceUrl("studio.menu.GetIcon?iconPath=icons/studio/dbo_increase_priority.gif"),
        "Go to top",
        function () {
            engineLogView.goToTop();
        }
    );

    // Go to end
    this.addAction(
        "go-to-end-action",
        Convertigo.createServiceUrl("studio.menu.GetIcon?iconPath=icons/studio/dbo_decrease_priority.gif"),
        "Go to end",
        function () {
            engineLogView.goToEnd();
        }
    );

    // Scroll lock
    this.addActionToggable(
        "scroll-lock-action",
        Convertigo.getBaseConvertigoStudioUrl("img/toolbar/scroll-lock.png"),
        "Scroll lock",
        function () {
            engineLogView.toggleLock();
        },
        !engineLogView.isAutoScrollEnabled()
    );

    // Clear logs
    this.addAction(
        "clear-logs-action",
        Convertigo.getBaseConvertigoStudioUrl("img/toolbar/clear-logs.png"),
        "Clear logs",
        function () {
            engineLogView.clearLogs();
        }
    );

    // Logs level
    var that = this;
    this.applyButtonId = "btn-engine-logs-level-apply";
    this.resetPropertyMap();
    this.addAction(
        "configure-logs-level-action",
        Convertigo.getBaseConvertigoStudioUrl("img/toolbar/configure-logs-level.png"),
        "Configure Logs level",
        function () {
            that.registerUpdateListeners();

            Convertigo.callService(
                "configuration.List",
                function (data, textStatus, jqXHR) {
                    // Create table with its properties
                    var $logSettingsTable = $("<table/>", {
                        id: "select-logs-level-table"
                    });
                    var $logSettingsTbody = $("<tbody/>");
                    $logSettingsTable.append($logSettingsTbody);
                    $(data).find("category[name='Logs']>property").each(function () {
                        $logSettingsTbody.append(that.createProperty($(this)));
                    });

                    var $buttons = $("<p/>", {
                        "class": "align-right"
                    });

                    // Cancel button
                    $buttons.append($("<button/>", {
                        type: "button",
                        text: "Cancel",
                        click: function () {
                            $.modal.close();
                        }
                    }));

                    // Apply button
                    $buttons.append($("<button/>", {
                        id: that.applyButtonId,
                        type: "button",
                        text: "Apply",
                        disabled: "disabled", // Disable button until a property changes
                        click: function () {
                            if (!$.isEmptyObject(that.propertyMap)) {
                                $.modal.close();

                                // Update Log levels
                                Convertigo.callService(
                                        "configuration.Update",
                                    function (data, textStatus, jqXHR) {
                                        that.resetPropertyMap();
                                    },
                                    DOMUtils.domToString2(that.createXmlDoc())
                                );
                            }
                        }
                    }));

                    // Create modal
                    var $modal = ModalUtils.createEmptyModal("engine-logs-select-level");
                    $modal
                        .append($("<h3/>", {
                            text: "Engine Log settings"
                        }))
                        .append($("<hr/>"))
                        .append($logSettingsTable)
                        .append($buttons);

                    // Open modal
                    $modal.modal({
                        closeExisting: false,
                        escapeClose: false,
                        clickClose: false,
                        showClose: false
                    });
                }
            );
        }
    );

    // Select columns
    this.addAction(
        "select-columns-action",
        Convertigo.getBaseConvertigoStudioUrl("img/toolbar/select-columns.png"),
        "Select columns",
        function () {
            var $selectColumnsTable = $("<table/>");
            var $selectColumnsTbody = $("<tbody/>");
            $selectColumnsTable.append($selectColumnsTbody);

            // Create dialog to select the columns to show
            engineLogView.getDisplayedColumns().forEach(function (elem) {
                var columnName = Object.keys(elem)[0];
                var showColumn = elem[columnName];
                
                $selectColumnsTbody.append(that.createColumnEntry(columnName, showColumn));
            });

            // Buttons
            var $buttons = $("<p/>", {
                "class": "align-right"
            });

            // Cancel button
            $buttons.append($("<button/>", {
                type: "button",
                text: "Cancel",
                click: function () {
                    $.modal.close();
                }
            }));

            // Apply button
            $buttons.append($("<button/>", {
                type: "button",
                text: "Apply",
                click: function () {
                    var engineLogColumns = [];

                    $selectColumnsTbody.find("tr").each(function () {
                        var showColumn = $(this).find("input").prop("checked");
                        var columnName = $(this).find("label").text();
                        engineLogColumns.push(VariableUtils.createObject(columnName, showColumn));
                    });

                    engineLogView.updateColumnsVisibility(engineLogColumns);

                    $.modal.close();
                }
            }));

            var $modal = ModalUtils.createEmptyModal("engine-logs-select-columns");
            $modal
                .append($("<h3/>", {
                    text: "Select columns"
                }))
                .append($("<hr/>"))
                .append($selectColumnsTable)
                .append($buttons);

            // Open modal
            $modal.modal({
                closeExisting: false,
                escapeClose: false,
                clickClose: false,
                showClose: false
            });
        }
    );
}

EngineLogToolbar.prototype = Object.create(Toolbar.prototype);
EngineLogToolbar.prototype.constructor = EngineLogToolbar;

EngineLogToolbar.prototype.createColumnEntry = function (name, show) {
    var text = name;
    name = name.replace(/\s/g, "-").toLowerCase();

    // Get ID + name + type
    var id = "log-column-" + name;

    // Get value and original value
    var $propertyValue = null;

    // Property - value line
    var $trProp = $("<tr/>");

    // Left column = property
    var $tdProp = $("<td/>");
    $tdProp.append($("<label/>", {
        "for": id,
        text: text
    }));
    // Right column = value
    var $tdValue = $("<td/>");

    // Check box
    var $propertyValue = $("<input/>", {
        id: id,
        name: name,
        "class": "config-checkbox",
        type: "checkbox"
    });

    if (show) {
        $propertyValue.attr("checked", "checked");
    }

    // Add property-value
    $tdValue.append($propertyValue);
    $trProp
        .append($tdProp)
        .append($tdValue);

    return $trProp;
};

EngineLogToolbar.prototype.createProperty = function ($xmlProperty) {
    // Get ID + name + type
    var name = $xmlProperty.attr("name");
    var id = "config_key_" + name;
    var type = $xmlProperty.attr("type");

    // Get value and original value
    var $propertyValue = null;
    var value = $xmlProperty.attr("value");
    var originalValue = $xmlProperty.attr("originalValue");

    // Property - value line
    var $trProp = $("<tr/>");

    // Left column = property
    var $tdProp = $("<td/>");
    $tdProp.append($("<label/>", {
        "for": id,
        text: $xmlProperty.attr("description")
    }));
    // Right column = value
    var $tdValue = $("<td/>");

    switch (type) {
        // Normal text
        case "Text":
            $propertyValue = $("<input/>", {
                "class": "config-text",
                "type": "text"
            });
            break;
        // Check box
        case "Boolean":
            $propertyValue = $("<input/>", {
                "class": "config-checkbox",
                "type": "checkbox",
                checked: originalValue === "true"
            });
            break;
        // List
        case "Combo":
            $propertyValue = $("<select/>", {
                "class": "config-combo"
            });

            // List all options
            $xmlProperty.find(">item").each(function () {
                var $item = $(this);
                $propertyValue.append($("<option/>", {
                    value: $item.attr("value"),
                    text: $item.text()
                }));
            });
            break;
    }

    // Should normally always be true
    if ($propertyValue) {
        // In case of C8O symbols, both values can be different
        // So we show the value in a tooltip and the original value in the value field
        if (originalValue !== value) {
            $propertyValue.attr("title", value);
        }

        // Update data of the property
        $propertyValue.val(originalValue);
        $propertyValue
        	.attr("name", $xmlProperty.attr("name"))
            .attr("id", id);

        // Add property-value
        $tdValue.append($propertyValue);
        $trProp
        	.append($tdProp)
			.append($tdValue);

        return $trProp;
    }
};

EngineLogToolbar.prototype.changeProperty = function (key, value) {
    this.propertyMap[key] = value;
    this.enableApplyBtnSelectLogLevel(this.applyButtonId);
};

EngineLogToolbar.prototype.createXmlDoc = function () {
    var xmlDoc = DOMUtils.createDOM("configuration");
    for (var key in this.propertyMap) {
        var propertyElement = xmlDoc.createElement("property");
        propertyElement.setAttribute("key", key);
        propertyElement.setAttribute("value", this.propertyMap[key]);
        xmlDoc.documentElement.appendChild(propertyElement);
    }

    return xmlDoc;
};

EngineLogToolbar.prototype.enableApplyBtnSelectLogLevel = function () {
    $("#" + this.applyButtonId).removeAttr("disabled");
};

EngineLogToolbar.prototype.registerUpdateListeners = function () {
    var that = this;
    $(document)
        .on("keyup", "#engine-logs-select-level input.config-text", function () {
            that.enableApplyBtnSelectLogLevel();
        })
        .on("change", "#engine-logs-select-level input.config-text", function () {
            that.changeProperty($(this).attr("name"), $(this).val());
        })
        .on("change", "#engine-logs-select-level select.config-combo", function () {
            that.changeProperty($(this).attr("name"), $(this).val());
        })
        .on("change", "#engine-logs-select-level input.config-checkbox", function () {
            that.changeProperty($(this).attr("name"), $(this).prop("checked") ? "true" : "false");
        });
};

EngineLogToolbar.prototype.resetPropertyMap = function () {
    this.propertyMap = {};
};
