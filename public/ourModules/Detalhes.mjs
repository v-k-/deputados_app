export default class Detalhes {
    static p5 = null; // Static property to hold p5 instance reference

    constructor(apiData = {}) {
        this.ultimoStatus = new UltimoStatus(apiData.ultimoStatus);
        this.cpf = apiData.cpf;
        this.sexo = apiData.sexo;
        this.urlWebsite = apiData.urlWebsite;
        this.redeSocial = apiData.redeSocial;
        this.dataNascimento = apiData.dataNascimento;
        this.dataFalecimento = apiData.dataFalecimento;
        this.ufNascimento = apiData.ufNascimento;
        this.municipioNascimento = apiData.municipioNascimento;
        this.escolaridade = apiData.escolaridade;
    }


} // === === === eof Detalhes

class UltimoStatus {
    constructor(ultimoStatus) {
        this.id = ultimoStatus.id;
        this.uri = ultimoStatus.uri;
        this.nome = ultimoStatus.nome;
        this.siglaPartido = ultimoStatus.siglaPartido;
        this.uriPartido = ultimoStatus.uriPartido;
        this.siglaUf = ultimoStatus.siglaUf;
        this.idLegislatura = ultimoStatus.idLegislatura;
        this.urlFoto = ultimoStatus.urlFoto;
        this.email = ultimoStatus.email;
        this.data = ultimoStatus.data;
        this.nomeEleitoral = ultimoStatus.nomeEleitoral;
        this.gabinete = new Gabinete(ultimoStatus.gabinete);
        this.situacao = ultimoStatus.situacao;
        this.condicaoEleitoral = ultimoStatus.condicaoEleitoral;
        this.descricaoStatus = ultimoStatus.descricaoStatus;
    }
}// === === === eof UltimoStatus

class Gabinete {
    constructor(gabinete) {
        this.nome = gabinete.nome;
        this.predio = gabinete.predio;
        this.sala = gabinete.sala;
        this.andar = gabinete.andar;
        this.telefone = gabinete.telefone;
        this.email = gabinete.email;
    }
}// === === === eof Gabinete