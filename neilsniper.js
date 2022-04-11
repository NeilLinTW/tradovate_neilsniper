// 參考 https://github.com/blakeharv/tradovate-indicators/blob/master/Fractal/Fractal.js
// 目標抓轉折，三根K線判斷買進、賣出邏輯，建議配合MACD使用

const predef = require("./tools/predef");
const meta = require("./tools/meta");
const p = require("./tools/plotting");
const SMA = require("./tools/SMA");

class NeilSniper {
    init() {
        this.symbol = this.props.symbol
        this.symbolSize = this.props.symbolSize
        this.symbolColorUp = this.props.symbolColorUp
        this.symbolColorDown = this.props.symbolColorDown
        this.barBuf = []
        this.smaValue = SMA(this.props.ma);
        this.smaShortValue = SMA(this.props.shortma);
    }

    map(d, i, history) {
        var fractal,
            upFractal,
            downFractal,
            bar;
        
        bar = {
            time: d.timestamp(),
            high: d.high(),
            open: d.open(),
            close: d.close(),
            ma:this.smaShortValue(d.close())
        }
        
        if (this.barBuf.length < 3) {
            // console.log(d.timestamp());
            this.barBuf.push(bar)
            return
        }
        

        this.barBuf.shift();
        this.barBuf.push(bar);

        let smaVal = this.smaValue(d.close());
        let smaShortVal = this.smaShortValue(d.close());

        // const currentHeight = Math.abs(d.close() - d.open());
        // const previousHeight = Math.abs((this.barBuf[1].close - this.barBuf[1].open));
        // const buyMA = d.close() < smaVal; // buy under sma
        // const heightDiff = Math.abs(currentHeight - previousHeight) <= 3;

        const maDiff = Math.abs(smaShortVal - smaVal) <= 4;
        const currentDiff = Math.abs(d.open() - d.close());

        const condA = this.barBuf[1].open > this.barBuf[1].close; //previous k bar is down
        const condB = d.close() >= d.open(); //current is up
        const condC = Math.abs(Math.round(d.close() - d.high(),0)) < 2; //current k bar is strong.
        // const condD = Math.abs(this.barBuf[1].close - this.barBuf[1].high) < 2; //previous k bar is signal.
        const condE = this.barBuf[1].close < this.barBuf[1].open; // previous k bar is down
        const condF = currentDiff > 2 && currentDiff < 5; // short body is good.
        // const maCheck = this.barBuf[1].ma > this.barBuf[0].ma;
        
        const buyResult = maDiff && condC && condF && condA && condB;
        
        if (buyResult){
            upFractal = d.low();
            // console.log('bar');
            // console.log(bar);
        }else{
            upFractal = undefined;
        }
        
        const condDwnA = d.close() < this.barBuf[1].close;
        const condDwnB = d.open() <= this.barBuf[1].open;
        const condDwnC = (d.high() - d.open()) > 3; //high but fall
        const condDwnD = (d.close() == d.low()) || (Math.abs(d.close() - d.low()) < 3);
        const condDwnE = currentDiff >= 0 && currentDiff < 4;
        const condDwnF = d.open() >= d.close();
        
        const sellMA = smaShortVal < smaVal; //ma is going down
        
        
        const sellDwnResult = condDwnC && condDwnF && condDwnD && condDwnA && condDwnB;
        
        
        if (sellDwnResult){
            downFractal = d.high();
            // console.log('bar');
            // console.log(bar);
        }else{
            downFractal = undefined;
        }
        
        fractal = {
            up: upFractal,
            down: downFractal,
            t:bar.time
        }
        
        
        
        return fractal;
        
    }

}


function MyPlotter(canvas, calculatorInstance, history) {
   for(let i=0; i<history.data.length; ++i) {
       const item = history.get(i);
       
    //   console.log(item.down == undefined);
       
       if (item.up !== undefined || item.down !== undefined) {
           const x = p.x.get(item);
           const props = calculatorInstance.props;
        //   const prior = history.get(i - 1);

           
           if(item.up !== undefined){
                canvas.drawLine(
                  p.offset(x , item.up - 2),
                  p.offset(x , item.up - 3),
                  {
                      color: props.symbolColorUp,
                      relativeWidth:0.5
                  }
                )
           }
           
           if(item.down !== undefined){
                canvas.drawLine(
                  p.offset(x , item.down + 12),
                  p.offset(x , item.down + 13),
                  {
                      color: props.symbolColorDown,
                      relativeWidth:0.5
                  }
                )
               
           }
              
       }
   }
}

module.exports = {
    name: "NeilSniper",
    description: "NeilSniper",
    calculator: NeilSniper,
    params: {
        ma: predef.paramSpecs.period(10),
        shortma: predef.paramSpecs.period(5),
        symbolColorUp: predef.paramSpecs.color("#EEE"),
        symbolColorDown: predef.paramSpecs.color("#EEE")
    },
    inputType: meta.InputType.BARS,
    plotter: [ predef.plotters.custom(MyPlotter), ],
    tags: ["Neil Sniper"],
    schemeStyles: predef.styles.solidLine("#8cecff")
};
