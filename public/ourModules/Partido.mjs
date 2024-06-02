 import { colors } from './colors.mjs';
export default class Partido {

    constructor(obj) {
        this.id = obj.id;
        this.sigla = obj.sigla;
        this.nome = obj.nome;
        this.url = obj.uri;
        this.colors = null
        this.getColors();
    }

  	getColors(){
  		if(colors.hasOwnProperty(this.sigla)){
  			this.colors = colors[this.sigla];
  		}else{
  			this.colors = colors['MISSING']
  		}
  	}
}