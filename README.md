Knockout Ajax Grid
============

This is my very first attempt of implementing Knockout's custom binding, I will include the server-side scripting later on.

Simply usage
----------------
First create a div for the knockout to bind to.
```html
    <div id="grid" data-bind="dataTable: {
        gridName: 'grid',
        pageName: 'text.html',
        pluginID: 523,
        parameter_list: 'USD1234',
        checkBoxVisible: 'true' 
      }"></div>
```

To bind and render the grid we can simply include the following code.
```javascript
    //create grid, and bind source from ajax
    var vm = DataEntryGrid("grid"); //wrapper method
```

API function
----------------
Binding can be used to control the out come of the data-source and rendered html.
```javascript

    $('#grid').viewModel().bindBody();  // we can use this to refresh content
    $('#grid').viewModel().unbindBody();  // any changes will not affect the datasource.
    
```

We can also inspect the data-source any time
```javascript

    var json = ko.toJSON($('#grid').viewModel().dataSource());  //  dataSoruce() will return as an observableArray.

```

Thsi grid will also support paging
```javascript

    var $grid = $('#grid')
    $grid.viewModel().nextPage(); // render next page records.
    $grid.viewModel().prevPage(); // render previous page records.
    
    $grid.viewModel().page(2);    // jump to second page.
    
```

Ajax grid are design to have all of the config stored within a Database, so we can implement different behaviour for different roles.
```javascript

    $('#grid').viewModel().getGridAdmin();
    $('#grid').viewModel().getDataSource();
    
```

Toggle checkbox is as easy as running the following script
```javascript

    $('#grid').viewModel().toggleCheckBox();
    
```
