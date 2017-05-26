let Calculator = (function() {
    let _domain = "amazon.com",
        _bsr = 1,
        _data = InitialData[_domain],
        _estimation = _data[0].estSale,
        $_domain = $("#domain"),
        $_bsr = $("#bsr"),
        $_unit_sales = $("#estimation");

    let calculate = () => {
        _data = InitialData[_domain];

        for (let i = 0; i < _data.length; i ++) {
            if (_data[i].max < _bsr) {
                continue;
            } else {
                _estimation = _data[i].estSale;
                break;
            }
        }
        
        $_unit_sales.val(_estimation);
    }

    let init = () => {
        $_domain.change((event) => {
            _domain = event.target.value;
            calculate();
        });

        $_bsr.change((event) => {
            _bsr = parseInt(event.target.value);
            calculate();
        });

        calculate();
    }

    return {
        init: init
    }
})();

(function() {
    Calculator.init();
})();