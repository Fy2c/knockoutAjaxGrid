
/** 
 *  GridDetailDTO Function (Core)
 *
 *   This is the function used to create JSON string.
 *
 **/
; var GridDetailDTO = (function () {
    'use strict';

    function gridDetailDto(args) {

        // constructor body
        args = args || {};
        var self = (this === window) ? {} : this;

        /** 
         *  @region Private
         *      This existed somewhere in the "void".
         *  =================================================
         **/
        var gridAdminDTORaw = function (data) {
            data = data || {};
            data.pageName = self.pageName;
            data.gridName = self.gridName;
            return data;
        };

        var dataSourceDTORaw = function (data) {
            data = data || {};
            data.pluginID = self.pluginID;
            data.parameter_list = self.parameter_list;
            data.method_name = self.method_name;
            data.class_name = self.class_name;
            return data;
        };


        /** 
         *  @region public 
         *      Will return self Object as result.
         *  =================================================
         **/
        self.pageName = args.pageName;
        self.gridName = args.gridName;
        self.method_name = args.method_name;
        self.class_name = args.class_name;
        self.parameter_list = args.parameter_list;

        self.gridAdminDTO = function (cache) {
            var data = gridAdminDTORaw();
            data.clear_cache = cache;
            return JSON.stringify(data);
        };

        self.dataSourceDTO = function (currentPage, pageSize, clear_cache) {
            var data = $.extend({}, gridAdminDTORaw(), dataSourceDTORaw());
            data.current_page = currentPage;
            data.page_size = pageSize;
            data.clear_cache = clear_cache || false;;
            return JSON.stringify(data);
        };
        
        self.dropdownDTO = function (pluginID, parameter_list) {
            var data = {};
            data.pluginID = pluginID;
            data.parameter_list = parameter_list;
            return JSON.stringify(data);
        };

        return self;
    }

    return gridDetailDto;

}());