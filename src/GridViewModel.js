
/** 
 *  GridViewModel Class Object (Core)
 *
 *   This is the main class object for the grid.
 *   e.g. $("#gridID").viewModel().removeGridAdmin().bindGridAdmin(_AjaxData);
 *        viewModel.removeGridAdmin().bindGridAdmin(_AjaxData);
 *
 **/
; var GridViewModel = (function ($) {
    'use strict';
  
    //GridViewModel Constructor

    function gridViewModel(args) {

        // enforces new
        if (!(this instanceof gridViewModel)) {
            return new gridViewModel(args);
        }

        // constructor body
        var self = (this === window) ? {} : this; //we would never want our public object to be global.
        var url = url || window.location.host;

        /** 
         *  @region Private
         *      This existed somewhere in the "void".
         *  =================================================
         **/
        var ajaxThreshold = 50;                 //50ms
        var pagingOptions = {
            pageSize: ko.observable(50), 		//Number of record per pageheaderRowBuilder
            totalCount: ko.observable(0), 		//Total number of record without paging
            currentPage: ko.observable(1) 		//current page number
        };

        var webServiceURL = vms.sessionHost + '/WebService.asmx/';
        var checkbox = ko.observable(true);
        var $slider;

        function errorHandler(err) {
            //session expire...
            if (err.status == 499) {
                location.replace(location.href);
            }
        }

        function ajaxGridAdminEvent() {
            $.ajax({
                type: "POST",
                url: webServiceURL + 'GetColumnsByUserId',
                data: self.dto.gridAdminDTO(),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    self.bindGridAdmin(response.d);
                },
                error: function (response, error) {
                    //error here
                    errorHandler(response);
                }
            });
        }

        function ajaxDataSourceEvent(cache) {
            var currentPage = pagingOptions.currentPage() - 1, pageSize = pagingOptions.pageSize();
            cache = cache || false;
            $.ajax({
                type: "POST",
                url: webServiceURL + 'GetDataSource',
                data: self.dto.dataSourceDTO(currentPage, pageSize, cache),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    response = $.parseJSON(response.d);
                    self.bindDataSource(response.data);
                    if (pagingOptions.totalCount() !== response.totalCount)
                        pagingOptions.totalCount(response.totalCount);
                },
                error: function (response, error) {
                    //error here
                    errorHandler(response);
                }
            }).done(function () {
                self.dataSoruceCallback();
            });

        }

        
        var ajaxDropDownEvent = function (columnKey, parameter) {
            var gridAdmin = self.gridAdmin, gridAdminColumn = {};
            
            for (var col in gridAdmin()) {
                gridAdminColumn = gridAdmin()[col];
                if (gridAdminColumn.field_name.toLowerCase() == columnKey.toLowerCase()) {
                    break;
                }
            }
            
            $.ajax({
                type: "POST",
                url: webServiceURL + 'GetPluginDataTable',
                data: self.dto.dropdownDTO(gridAdminColumn.plugin_id, parameter), //626, "TRV939J00495SZ1, true"
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    response = $.parseJSON(response.d);
                    response = $.parseJSON(response.data);

                    if (!ko.isObservable(gridAdminColumn.dataset))
                        gridAdminColumn.dataset = ko.observableArray([]);
                    
                    gridAdminColumn.dataset($.extend(gridAdminColumn.dataset(), response));
                    
                },
                error: function (response, error) {
                    //error here
                }
            });
        };


        /** 
         *  @region public 
         *      Will return self Object as result.
         *  =================================================
         **/
        self.gridAdmin = ko.observableArray([]);
        self.dataSource = ko.observableArray([]);
        self.dataSoruceCallback = $.noop;
        
        //removeGridAdmin (empty all column)
        self.removeGridAdmin = function () {
            self.gridAdmin.removeAll();
            return self; //Simple chaining implementation
        };

        //addColumn
        self.addColumn = function (data) {
            if ($.isArray(data)) {
                //apply to array if data is an array.
                self.gridAdmin.push.apply(self.gridAdmin, data);
            } else {
                self.gridAdmin.push(data);
            }
            return self;
        };

        //binding GridAdmin setting
        self.bindGridAdmin = function (data) {
            data = (typeof data === 'string') ? $.parseJSON(data) : data;
            self.gridAdmin(data);
            return self;
        };

        //get Grid Admin from webservice (throttle function, timelimt = AJaxThreshold)
        self.getGridAdmin = (function () {

            var lastExecution = new Date((new Date()).getTime() - ajaxThreshold);
            var ajaxGridAdminThrottle = ajaxGridAdminEvent;

            return function () {
                if ((lastExecution.getTime() + ajaxThreshold) <= (new Date()).getTime()) {
                    lastExecution = new Date();

                    return ajaxGridAdminThrottle.apply(this, arguments);
                }
            };
        }());

        //binding DataSource setting
        self.bindDataSource = function (data) {
            data = (typeof data === 'string') ? $.parseJSON(data) : data;
            self.unbindBody();
            self.dataSource.removeAll();
            self.dataSource(data);
            return self;
        };

        //get Grid Admin from webservice (throttle function, timelimt = AJaxThreshold)
        self.getDataSource = (function (value) {

            var lastExecution = new Date((new Date()).getTime() - ajaxThreshold);
            var ajaxDataSourceThrottle = ajaxDataSourceEvent;

            return function () {
                if ((lastExecution.getTime() + ajaxThreshold) <= (new Date()).getTime()) {
                    lastExecution = new Date();
                    return ajaxDataSourceThrottle.apply(this, arguments);
                }
            };
        }());

        // this will return "selected" row object pointing to the Datasource
        // if shallow copy changes so does the Datasource
        self.getSelectedRowShallowCopy = function () {
            var arrResult = [];
            for (var i = 0, len = self.dataSource().length; i < len; i++) {
                if (self.dataSource()[i]._is_chked() == true)
                    arrResult.push(self.dataSource()[i]);
            }

            return arrResult;
        };
 
        //get SelectedRow and return array of javascript object
        self.getSelectedRowDeepCopy = function () {
            var arrResult = [];
            for (var i = 0, len = self.dataSource().length; i < len; i++) {
                if (self.dataSource()[i]._is_chked() == true) {
                    var objWithObserable = ko.toJSON(self.dataSource()[i]); //convert all observable to value
                    arrResult.push($.parseJSON(objWithObserable)); //parse and push JSON
                }
            }

            return arrResult;
        };

        //get returned data source deep copy
        self.getDataSourceDeepCopy = function () {
            var objWithObserable = ko.toJSON(self.dataSource()); //convert all observable to value
            return $.parseJSON(objWithObserable); //parse and push JSON
        };

        //did not use throttling here, we could have multiple call for dropdown within the same time.
        self.getDropDown = ajaxDropDownEvent;

        self.toggleCheckBox = function () {
            checkbox(!checkbox());
        };

        self.CheckBoxVisible = function (data) {
            data = String(data).toLowerCase() === 'true' ? true : false;
            checkbox(data);
        };

        self.unbindBody = function () {
            var $tbody = $(self.domElement).find('tbody');
            ko.unapplyBindings($tbody);
        };

        self.bindBody = function () {
            var $tbody = $(self.domElement).find('tbody');
            ko.applyBindings(self.dataSource(), $tbody[0]);
        };

        //next page
        self.nextPage = function () {
            var current = pagingOptions.currentPage;
            if (current() * pagingOptions.pageSize() < pagingOptions.totalCount())
                current(current() + 1);
        };

        //prev page
        self.prevPage = function () {
            var current = pagingOptions.currentPage;
            if (current() > 1) current(current() - 1);

        };

        //jump to page
        self.page = function (p) {
            var current = pagingOptions.currentPage;
            if (current() * pagingOptions.pageSize() < pagingOptions.totalCount())
                pagingOptions.currentPage(p);
        };

        //set page size
        self.pageSize = function (s) {
            pagingOptions.pageSize(s);
        };

        //create paging slider
        self.makePagination = function () {
            var $foot = $(self.domElement).find('.footer');
            var $sliderContainer = $('<div class="slider-container"></div>').appendTo($foot);
            $slider = $('<div class="slider"></div>').appendTo($sliderContainer);

            $slider.slider({
                value: parseInt(pagingOptions.currentPage()),
                min: 1,
                max: Math.ceil(parseInt(pagingOptions.totalCount()) / parseInt(pagingOptions.pageSize())),
                step: 1,
                width: '534px',
                slide: function (event, ui) {
                    //update page number as of the slide event
                    //pagingOptions.currentPage(ui.value);
                },
                stop: function (event, ui) {
                    pagingOptions.currentPage(ui.value);
                },
                create: function (event, ui) {
                    var $handler = $slider.find('.ui-slider-handle');
                    $('<div class="arrow left-arrow"></div>').insertBefore($handler);
                    $('<div class="arrow right-arrow"></div>').insertAfter($handler);
                }
            });
        };

        // subscription
        self.gridAdmin.subscribe(function (v) {
            if (self.gridAdmin().length < 1) return;
            var headerBuilder = new HeaderRowBuilder(self.gridAdmin, self.domElement, { webService: webServiceURL, dto: self.dto });
            var bodyBuilder = new BodyRowBuilder(self.dataSource, self.gridAdmin, self.domElement);
            headerBuilder.render();
            bodyBuilder.render();
        });
        self.dataSource.subscribe(function (v) {
            if (self.dataSource().length < 1) return;
            var bodyBuilder = new BodyRowBuilder(self.dataSource, self.gridAdmin, self.domElement);
            bodyBuilder.render();
            checkbox.valueHasMutated();
        });
        
        pagingOptions.pageSize.subscribe(function (v) {
            //self.getDataSource();
        });
        pagingOptions.currentPage.subscribe(function (v) {
            self.getDataSource();
            if ($slider) $slider.slider('value', v);
        });
        pagingOptions.totalCount.subscribe(function (v) {
            if (pagingOptions.totalCount() > pagingOptions.pageSize())
                self.makePagination();
        });
        checkbox.subscribe(function (v) {
            if (v == true) {
                $(self.domElement).find('.chkcell').show();
            }
            else {
                $(self.domElement).find('.chkcell').hide();
            }
        });

        return self; //return as a public Object
    }

    return gridViewModel;

}(jQuery));


/** 
 *  DataEntryGrid Class Object (Optional Wrapper)
 *
 *   This is used to force new grid class object.
 *   e.g. var grid = DataEntryGrid('gridID');
 *
 **/
; var DataEntryGrid = function (gridId) {
    'use strict';

    var vm = new GridViewModel();
    ko.applyBindings(vm, document.getElementById(gridId));

    return vm;

};


/** 
 *  JQuery Based Grid Plugin (Optional Wrapper)
 *
 *   This is used to retrive grid viewModel based on a jquery selector.
 *   e.g. $('#gridID').viewModel();
 *
 **/
; (function ($) {
    $.fn.viewModel = function () {
        return this.data('viewModel');
    };
}(jQuery));


/** 
 *  Knockout Custom Binding (Core)
 *
 *   This is used for custom binding in which will be linked with view model.
 *
 **/
// dataTable Custom binding
; ko.bindingHandlers.dataTable = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

        var grid = bindingContext.$data; // (viewModel) parameter is deprecated in Knockout 3.x. 
        var value = valueAccessor();

        $.data(element, 'viewModel', grid); //Optional

        grid.dto = new GridDetailDTO(value);

        grid.dto.pluginID = value.pluginID;
        grid.dto.parameter_list = value.parameter_list;

        $(element).addClass('data-entry-grid')
            .append('<div class="viewport"><table><thead></thead><tbody></tbody><tfoot></tfoot></table></div><div class="footer"></div>');

        grid.domElement = element;
        grid.getGridAdmin().getDataSource();

        EventBuilder(element, grid);
        grid.CheckBoxVisible(value.checkBoxVisible);
        
        ko.applyBindingsToDescendants(valueAccessor(), element);
        return { controlsDescendantBindings: true };
    }
}


// dataRow Custom binding
; ko.bindingHandlers.dataRow = {
    init: function (element, valueAccessor) {

        ko.applyBindingsToDescendants(valueAccessor(), element);
        return { controlsDescendantBindings: true };
    }
};


// Custom debug binding
; ko.bindingHandlers.debug = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (!console) return {};
        console.log(element);
        console.log(valueAccessor());
        console.log(allBindingsAccessor());
        console.log(viewModel);
        console.log(bindingContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        if (!console) return {};
        console.log('updated');
        console.log(element);
        console.log(valueAccessor());
        console.log(allBindingsAccessor());
        console.log(viewModel);
        console.log(bindingContext);
    }
};
