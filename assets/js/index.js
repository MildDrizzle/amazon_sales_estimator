let Calculator = (function() {
    let _domain = "amazon.com",
        _bsr = 1,
        _data = InitialData[_domain],
        _estimation = _data[0].estSale,
        $_domain = $("#domain"),
        $_bsr = $("#bsr"),
        $_unit_sales = $("#estimation");

    let getEstimation = (x1, y1, x2, y2) => {
        let sqrtX1 = Math.sqrt(x1),
            sqrtX2 = Math.sqrt(x2 + 1);

        let alpa = (y2 - y1) / (sqrtX1 - sqrtX2);
        let max = (y2 * sqrtX1 - y1 * sqrtX2) / (sqrtX1 - sqrtX2);

        return {alpa, max};
    }

    let calculate = () => {
        _data = InitialData[_domain];

        for (let i = 0; i < _data.length; i ++) {
            if (_data[i].max < _bsr) {
                continue;
            } else {
                if (i == _data.length - 1) {
                    _estimation = _data[i].estSale;
                } else {
                    let coefficients = getEstimation(_data[i].min, _data[i].estSale, _data[i].max, _data[i + 1].estSale);
                    _estimation = coefficients.max - coefficients.alpa * Math.sqrt(_bsr);
                }
                break;
            }
        }
        
        $_unit_sales.val(parseInt(_estimation));
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