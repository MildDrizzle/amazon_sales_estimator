/**
 * Created by Andrey Klochkov on 12.04.2015.
 */

function DataStorage(){
    this.defaultData = {
        isWaitingForPulling: false,
        isPulling: false,
        pageNum: {
            MainTab: '1',
            KeywordAnalysisTab: '1'
        },
        totalResults: '',
        books:
            [
                //{"No": "", "Url":"", "ParentUrl":"", "NextUrl": "", "Title":"", "Description":"", "Price": "", "EstSales": "", "SalesRecv": "", "Reviews": "", "SalesRank": "", "Category": "", "CategoryKind":"Seller", "PrintLength":"", "Author":"", "DateOfPublication":"", "GoogleSearchUrl":"", "GoogleImageSearchUrl":"", "Rating":"",
                // PullingToken: ''}
            ]
    };

    this.data = undefined;
}

DataStorage.prototype.get = function(){
    if (typeof this.data === 'undefined')
    // clone object
        this.data = JSON.parse(JSON.stringify(this.defaultData));
    return this.data;
};

DataStorage.prototype.remove = function(){
    this.data = undefined;
};

