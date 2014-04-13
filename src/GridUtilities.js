
/** 
 *  HeaderRowBuilder Class Object (Core)
 *
 *   This is the function used to create table header html for the grid.
 *
 **/
; var HeaderRowBuilder = (function ($) {
    'use strict';

    //HeaderRowBuilder Constructor
    function headerRowBuilder(gridAdmin, domElement, options) {
        
        // enforces new
        if (!(this instanceof headerRowBuilder)) {
            return new headerRowBuilder(gridAdmin, domElement, options);
        }


        // constructor body
        var self = (this === window) ? {} : this;
        options = options || {};
        
        /** 
	     *  @region Private 
	     *      This existed somewhere in the "void".
	     *  =================================================
	     **/
        //build header cell
        var build = function () {

            var html = '<tr>';
            html += CellBuilder('', {}, { 'header': true, 'class': 'empty' });
            //no point using cell builder here, it is much easier for debugging.
            html += '<th class="chkcell"><input class="chkheader" type="checkbox" /></th>';
            
            for (var i = 0, len = gridAdmin().length ; i < len; i++) {
                var gridAdminColumn = gridAdmin()[i];
                
                //Create dataset for dropdown stored into the gridadmin's column object
                if (gridAdminColumn.column_type.toString() === '5')
                    gridAdminColumn.dataset = ko.observableArray([]);

                html += CellBuilder(gridAdminColumn.display_name, gridAdminColumn, { header: true });
            }
            html += '</tr>';

            return html;
        };


        /** 
	     *  @region Public 
	     *      Will return self Object as result.
	     *  =================================================
	     **/
        //render header HTML
        self.render = function () {
            var html = build();
            var $dom = $(domElement)

            $dom.find('thead').html(html);
            $dom.find('th').children().resizable({ handles: 'e', minWidth: 95 });
            
            return self;
        };

        return self; //return as an Object
    }

    return headerRowBuilder;

}(jQuery));


/** 
 *  BodyRowBuilder Class Object (Core)
 *
 *   This is the function used to create table body row html for the grid.
 *
 **/
; var BodyRowBuilder = (function ($) {
    'use strict';

    //BodyRowBuilder Constructor
    function bodyRowBuilder(dataSource, gridAdmin, domElement, options) {
        // enforces new
        if (!(this instanceof bodyRowBuilder)) {
            return new bodyRowBuilder(dataSource, gridAdmin, domElement, options);
        }

        // constructor body
        var self = (this === window) ? {} : this;
        options = options || {};
        
        /** 
	     *  @region Private 
	     *      This existed somewhere in the "void".
	     *  =================================================
	     **/
        var valueCleaner = function (value) {
            //handle null value
            value = value == null || value == 'undefined' ? '' : value;

            //handling date
            var patt = /Date\((-?\d+)\)/;
            if (value.toString().match(patt))
                value = formatDate(new Date(parseInt(value.toString().match(patt)[1])));

            return value;
        };

        //build body cell
        var build = function () {

            var html = '';

            //loop through all source
            for (var row in dataSource()) {
                html += '<tr data-bind="dataRow: $root[' + row + ']">';
                html += CellBuilder(parseInt(row) + 1);
                
                //creating a column in datasource for checkbox
                dataSource()[row]._is_chked = ko.observable(false);

                //no point using cell builder here, it is much easier for debugging.
                html += '<td class="chkcell"><input class="chkbody" type="checkbox" data-bind="checked: $data._is_chked" /></td>';
                
                for (var col in gridAdmin()) { //Order of the columns are defined by gridAdmin -> store procedure based.
                    var gridAdminColumn = gridAdmin()[col]; //simple pointer to gridAdmin column
                    var fieldname = gridAdminColumn.field_name;
                    var editable = gridAdminColumn.editable;

                    var dataRow = dataSource()[row];
                    var value = dataRow[fieldname];
                    
                    value = valueCleaner(value);

                    //dropdown repository
                    if (gridAdminColumn.column_type.toString() === 'dropdown') {
                        dataRow['_dataset' + fieldname] = gridAdminColumn.dataset; //shallow copy (address pointer)
                    }

                    //if the field is editable turn value in datasource to an observable object
                    if (editable && !ko.isObservable(dataSource()[row][fieldname]))
                        dataSource()[row][fieldname] = ko.observable(value); //make observable, will do dynamic binding within Cell Builder
                    
                    //The last object parameter, is used for building dropdown list.
                    html += CellBuilder(value, gridAdminColumn, { text: dataSource()[row]['_display' + fieldname] || dataSource()[row][fieldname] });

                }
                html += '</tr>';
            }
            return html;
        };


        /** 
	     *  @region Public 
	     *      Will return self Object as result.
	     *  =================================================
	     **/
        //render header HTML
        self.render = function () {
            var html = build();
            var $dom =$(domElement);
            var $tbody = $dom.find('tbody');

            $tbody.html(html);
            
            ko.unapplyBindings($tbody);
            ko.applyBindings(dataSource, $tbody[0]);
            
            $dom.find('tr:nth-child(even)').addClass("even");
            $dom.find('tr:nth-child(odd)').addClass("odd");
            
            return self;
        };

        self.unbindBody = function () {
            var $tbody = $(domElement).find('tbody');
            ko.unapplyBindings($tbody);
        };

        self.bindBody = function () {
            var $tbody = $(domElement).find('tbody');
            ko.applyBindings(dataSource(), $tbody[0]);
        };

        return self;
    }

    return bodyRowBuilder;

}(jQuery));


/** 
 *  CellBuilder Function (Core)
 *
 *   This is the function used to create cell html for the grid.
 *
 **/
; function CellBuilder(text, columnAdmin, options) {
    text = text || '';
    columnAdmin = columnAdmin || {};
    options = options || {};

    var classBuilder = [], valueBuilder = [], styleBuilder = [], databindBuilder = [];
    var cellHtml = '<td class="{0}" style="{1}">{2}</td>';

    if (options.header) cellHtml = '<th class="{0}" style="{1}">{2}</th>';

    if (options['class']) classBuilder.push(options['class']);                                              // get class from options
    if (columnAdmin.field_type) classBuilder.push(columnAdmin.field_type);                                  // create class from gridAdmin column type
    if (columnAdmin.validation_column_required) classBuilder.push(columnAdmin.validation_column_required);  // create class if validation are required

    if (columnAdmin.hidden) styleBuilder.push('display:none');           //hide column
    if (columnAdmin.width) styleBuilder.push('width:' + columnAdmin.width);
//    if (columnAdmin.editable && options.header)
//       text = '<img alt="edit" src="data:image/png;base64,R0lGODlhDgAPAMQAAF5SNvCrELaZYNy6b9GNJ+awLaJ1NMeuXI13R/DfLfbSjNGJM3lsTPG4E8aCMM+3UsWlYp+HUteTIvO9DO/dL9OWPbqfafetCNCwY+rFbeW4MfK6E+7dPPS9EfetEP///yH5BAUUAB8ALAAAAAAOAA8AAAVG4CeO5PeU6IdlWjo+XCMV7kFNRCCkD9XklZQl0ZEEFrzExuFBomwbo7N0SPyOPJ9UOIBshYquwfWJKBQIsgCASJMBDPIoBAA7" />' + text;

    if (columnAdmin.editable && !options.header) {

        if (columnAdmin.field_type) classBuilder.push('editable');

        databindBuilder.push('value:$data.' + columnAdmin.field_name);
        switch (columnAdmin.column_type.toString()) {
            case 'dropdown': //dropdown list

                columnAdmin.dataset($.extend(columnAdmin.dataset(), [{ text: options.text, value: text }]));

                databindBuilder.push('options: $data._dataset' + columnAdmin.field_name);
                databindBuilder.push('optionsText:\'text\'');
                databindBuilder.push('optionsValue:\'value\'');
                databindBuilder.push('valueAllowUnset: true');

                valueBuilder += '<select class="{0}" style="{1}" data-bind="{3}"/></select>';
                break;
            default:
                databindBuilder.push("valueUpdate: 'afterkeyup'");
                valueBuilder += '<input type="text" class="{0}" style="{1}" data-bind="{3}"/>';
                break;
        }
    }
    else {
        valueBuilder += '<div class="{0}" style="{1}">{2}</div>';
    }

    classBuilder = classBuilder.length > 1 ? classBuilder.join(" ") : "";
    databindBuilder = databindBuilder.length > 0 ? databindBuilder.join(",") : "";
    styleBuilder = styleBuilder.join(';');
    
    valueBuilder = String.format(valueBuilder.toString(), classBuilder, styleBuilder, text, databindBuilder);

    return String.format(cellHtml.toString(), classBuilder, styleBuilder, valueBuilder);

}


/** 
 *  EventBuilder Function (Core)
 *
 *   This is the function used to create event for grid.
 *
 **/
; function EventBuilder(domElement, viewModel) {

    //chkbox field changes for thead
    $(domElement).on("change", '.chkheader', function (e) {
        if (e.handled === true) return; //avoiding event firing twice
        e.handled = true;
        
        var value = $(this).is(':checked');
        var source = viewModel.dataSource();
        for (var i = 0, len = source.length; i < len; i++) {
            source[i]._is_chked(value);
        }

    });

}


/** 
 *  @Function ko.unapplyBindings(Core)
 *
 *   This is small wrapper function for removing binding from a JQuery object
 *
 **/
; (function ($) {
    if (!ko.unapplyBindings) {
        ko.unapplyBindings = function ($node, remove) {
            // unbind events
            $node.find("*").each(function () {
                $(this).unbind();
            });

            // Remove KO subscriptions and references
            if (remove) {
                ko.removeNode($node[0]);
            } else {
                ko.cleanNode($node[0]);
            }
        };
    }
}(jQuery));


/** 
 *  @Function String.format(Core)
 *
 *   This is a port function of C# String.format function
 *
 **/
; (function() {
    if (!String.format)
        String.format = function(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };

}())


/** 
 *  @Function formatDate(Optional)
 *
 *   Date converter.
 *
 **/
; function formatDate(vDate) {
    var formattedDate = vDate;
    var d = formattedDate.getDate();
    var m = formattedDate.getMonth() + 1;
    var y = formattedDate.getFullYear();

    return m + "/" + d + "/" + y;
}