/* =========================================================

   ELNORA — ENTREGA LOCAL AUTOMÁTICA

   Versão corrigida



   ORIGEM: CEP 06702-675 — Cotia/SP



   REGRAS:

   - Entregas somente para Itapevi/SP e Cotia/SP

   - Máximo de 10 km na IDA

   - Cobrança do combustível considera IDA + VOLTA

   - Validação de CEP

   - Consulta de endereço com fallback

   - Cálculo de rota pelo OSRM

   ========================================================= */



window.ELNORA_DELIVERY_CONFIG = {



  /* CEP DE ONDE SAEM AS ENTREGAS */

  originCep: "06702675",



  /* DISTÂNCIA MÁXIMA SOMENTE NA IDA */

  maxOneWayKm: 10,



  /* CIDADES PERMITIDAS */

  allowedCities: [

    "ITAPEVI",

    "COTIA"

  ],



  allowedState: "SP",



  /* FAIXAS MUNICIPAIS DE CEP */

  cepRanges: {



    ITAPEVI: {

      start: 6650001, // 06650-001

      end: 6699999    // 06699-999

    },



    COTIA: {

      start: 6700001, // 06700-001

      end: 6729999    // 06729-999

    }



  },



  /*

    IMPORTANTE:

    Configuração do Fiat Mobi Trekking.



    Gasolina configurada em R$ 6,50 por litro.

  */

  vehicleName: "Fiat Mobi Trekking",

  fuelType: "Gasolina",

  vehicleKmPerLiter: 13.5,

  fuelPricePerLiter: 6.50



};





(function () {



  "use strict";



  const C = window.ELNORA_DELIVERY_CONFIG;





  /* =====================================================

     ESTADO DO CÁLCULO

     ===================================================== */



  const state = {



    quote: null,



    busy: false



  };





  /* =====================================================

     UTILITÁRIOS

     ===================================================== */



  const money = value => {



    return Number(value).toLocaleString(

      "pt-BR",

      {

        style: "currency",

        currency: "BRL"

      }

    );



  };





  const digits = value => {



    return String(value || "")

      .replace(/\D/g, "");



  };





  const normalize = value => {



    return String(value || "")

      .normalize("NFD")

      .replace(/[\u0300-\u036f]/g, "")

      .trim()

      .toUpperCase();



  };





  const formatCep = value => {



    const cep = digits(value);



    if (cep.length !== 8) {

      return cep;

    }



    return (

      cep.substring(0, 5) +

      "-" +

      cep.substring(5)

    );



  };





  /* =====================================================

     IDENTIFICA CIDADE PELA FAIXA DO CEP

     ===================================================== */



  function cityByCep(cep) {



    const number = Number(

      digits(cep)

    );





    if (!Number.isFinite(number)) {



      return null;



    }





    for (

      const [city, range]

      of Object.entries(

        C.cepRanges || {}

      )

    ) {



      if (

        number >= range.start &&

        number <= range.end

      ) {



        return city;



      }



    }





    return null;



  }





  /* =====================================================

     MENSAGEM NA TELA

     ===================================================== */



  function setStatus(

    message,

    type = ""

  ) {



    const element =

      document.getElementById(

        "delivery-calc-status"

      );





    if (!element) {

      return;

    }





    element.textContent =

      message;





    element.className =

      type

        ? `delivery-status-${type}`

        : "";



  }





  /* =====================================================

     ENVIA RESULTADO PARA O CARRINHO

     ===================================================== */



  function dispatch() {



    window.dispatchEvent(



      new CustomEvent(

        "elnora:delivery-quote",

        {

          detail: state.quote

        }

      )



    );



  }





  /* =====================================================

     CONSULTA BRASIL API

     ===================================================== */



  async function consultarBrasilAPI(cep) {
    const response = await fetch(
      `https://brasilapi.com.br/api/cep/v2/${cep}`,
      {
        method: "GET",
        headers: { "Accept": "application/json" }
      }
    );

    if (!response.ok) {
      throw new Error(`BrasilAPI HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      cep: digits(data.cep || cep),
      street: data.street || "",
      neighborhood: data.neighborhood || "",
      city: data.city || "",
      state: data.state || "",
      lat: Number(data?.location?.coordinates?.latitude),
      lon: Number(data?.location?.coordinates?.longitude),
      source: "BrasilAPI"
    };
  }


  async function consultarViaCEP(cep) {
    const response = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`,
      {
        method: "GET",
        headers: { "Accept": "application/json" }
      }
    );

    if (!response.ok) {
      throw new Error(`ViaCEP HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado.");
    }

    return {
      cep: digits(data.cep || cep),
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      lat: NaN,
      lon: NaN,
      source: "ViaCEP"
    };
  }


  /*
   * FALLBACK DE COORDENADAS
   * Se BrasilAPI não fornecer latitude/longitude,
   * usa o endereço confirmado pelo ViaCEP para
   * tentar obter as coordenadas no OpenStreetMap.
   */
  async function geocodificarEndereco(address) {
    const queries = [];

    const fullAddress = [
      address.street,
      address.neighborhood,
      address.city,
      address.state,
      formatCep(address.cep),
      "Brasil"
    ].filter(Boolean).join(", ");

    const cepAddress = [
      formatCep(address.cep),
      address.city,
      address.state,
      "Brasil"
    ].filter(Boolean).join(", ");

    if (fullAddress) queries.push(fullAddress);
    if (cepAddress && cepAddress !== fullAddress) queries.push(cepAddress);

    for (const query of queries) {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=jsonv2&limit=1&countrycodes=br` +
          `&q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Accept-Language": "pt-BR,pt;q=0.9"
          }
        });

        if (!response.ok) continue;

        const data = await response.json();
        const result = Array.isArray(data) ? data[0] : null;

        if (!result) continue;

        const lat = Number(result.lat);
        const lon = Number(result.lon);

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return {
            lat,
            lon,
            source: "OpenStreetMap"
          };
        }
      } catch (error) {
        console.warn(
          "ELNORA: geocodificação alternativa indisponível.",
          error
        );
      }
    }

    return null;
  }


  /*
   * CONSULTA PRINCIPAL
   * 1. BrasilAPI
   * 2. ViaCEP
   * 3. OpenStreetMap para coordenadas, se necessário
   */
  async function cepData(cep) {
    const c = digits(cep);

    if (c.length !== 8) {
      throw new Error("CEP inválido. Digite os 8 números.");
    }

    let brasilData = null;
    let viaData = null;

    try {
      brasilData = await consultarBrasilAPI(c);

      if (
        brasilData.city &&
        brasilData.state &&
        Number.isFinite(brasilData.lat) &&
        Number.isFinite(brasilData.lon)
      ) {
        return brasilData;
      }
    } catch (error) {
      console.warn(
        "ELNORA: BrasilAPI indisponível ou sem coordenadas.",
        error
      );
    }

    try {
      viaData = await consultarViaCEP(c);
    } catch (error) {
      console.warn("ELNORA: falha no ViaCEP.", error);

      if (brasilData?.city && brasilData?.state) {
        viaData = {
          ...brasilData,
          cep: c
        };
      } else {
        throw new Error(
          "Não foi possível localizar este CEP. Confira os números e tente novamente."
        );
      }
    }

    const result = {
      ...viaData,
      street: viaData.street || brasilData?.street || "",
      neighborhood: viaData.neighborhood || brasilData?.neighborhood || "",
      city: viaData.city || brasilData?.city || "",
      state: viaData.state || brasilData?.state || "",
      lat: Number.isFinite(brasilData?.lat) ? brasilData.lat : NaN,
      lon: Number.isFinite(brasilData?.lon) ? brasilData.lon : NaN,
      source: brasilData ? "ViaCEP + BrasilAPI" : "ViaCEP"
    };

    if (
      Number.isFinite(result.lat) &&
      Number.isFinite(result.lon)
    ) {
      return result;
    }

    const geo = await geocodificarEndereco(result);

    if (geo) {
      return {
        ...result,
        lat: geo.lat,
        lon: geo.lon,
        source: `${result.source} + ${geo.source}`
      };
    }

    throw new Error(
      `O CEP ${formatCep(c)} foi encontrado, mas não foi possível obter sua localização no mapa para calcular a entrega.`
    );
  }


  function validateDestinationCep(

    cep,

    destination

  ) {



    const cityFromRange =

      cityByCep(cep);





    const cityFromAPI =

      normalize(

        destination.city

      );





    const stateFromAPI =

      normalize(

        destination.state

      );





    /* ESTADO */



    if (

      stateFromAPI !==

      normalize(C.allowedState)

    ) {



      throw new Error(



        "Entrega disponível somente para Itapevi/SP e Cotia/SP."



      );



    }





    /* FAIXA DO CEP */



    if (!cityFromRange) {



      throw new Error(



        "Este CEP está fora da região de entrega da ELNORA."



      );



    }





    /* CIDADE */



    const allowed =

      (C.allowedCities || [])

        .map(normalize);





    if (

      !allowed.includes(

        cityFromAPI

      )

    ) {



      throw new Error(



        `Entrega não disponível para ${destination.city}/${destination.state}.`



      );



    }





    /*

      DUPLA VERIFICAÇÃO:

      cidade retornada pela API

      deve corresponder à faixa.

    */



    if (

      cityFromAPI !==

      cityFromRange

    ) {



      throw new Error(



        "O CEP informado não corresponde corretamente à cidade cadastrada. Confira o CEP."



      );



    }





    return cityFromRange;



  }





  /* =====================================================

     CALCULA ROTA

     ===================================================== */



  async function routeKm(

    origin,

    destination

  ) {



    /*

      Para calcular rota precisamos

      obrigatoriamente de coordenadas.

    */



    if (

      !Number.isFinite(origin.lat) ||

      !Number.isFinite(origin.lon)

    ) {



      throw new Error(



        "O CEP de origem foi encontrado, mas o serviço não forneceu coordenadas para calcular a rota."



      );



    }





    if (

      !Number.isFinite(

        destination.lat

      ) ||

      !Number.isFinite(

        destination.lon

      )

    ) {



      throw new Error(



        "CEP encontrado, mas não foi possível obter sua localização no mapa para calcular a entrega."



      );



    }





    const url =



      `https://router.project-osrm.org/route/v1/driving/` +



      `${origin.lon},${origin.lat};` +



      `${destination.lon},${destination.lat}` +



      `?overview=false&alternatives=false&steps=false`;





    let response;





    try {



      response =

        await fetch(url);



    } catch (error) {



      console.error(

        "ELNORA: erro de conexão com serviço de rota.",

        error

      );





      throw new Error(



        "Não foi possível acessar o serviço de rota neste momento."



      );



    }





    if (!response.ok) {



      throw new Error(



        "Serviço de cálculo de rota temporariamente indisponível."



      );



    }





    const data =

      await response.json();





    if (

      data.code !== "Ok"

    ) {



      throw new Error(



        "Não foi possível encontrar uma rota para este endereço."



      );



    }





    const meters =

      Number(

        data?.routes?.[0]?.distance

      );





    if (

      !Number.isFinite(meters)

    ) {



      throw new Error(



        "Não foi possível calcular a distância da entrega."



      );



    }





    return (

      meters / 1000

    );



  }





  /* =====================================================

     CÁLCULO DA ENTREGA

     ===================================================== */



  async function calculate() {



    const cepElement =

      document.getElementById(

        "delivery-cep"

      );





    /* CAMPO NÃO EXISTE */



    if (!cepElement) {



      return null;



    }





    const destinationCep =

      digits(

        cepElement.value

      );





    /* CEP DO CLIENTE INVÁLIDO */



    if (

      destinationCep.length !== 8

    ) {



      state.quote = null;



      dispatch();





      setStatus(

        "Digite um CEP válido com 8 números.",

        "error"

      );





      return null;



    }





    /* CEP DE ORIGEM */



    const originCep =

      digits(

        C.originCep

      );





    if (

      originCep.length !== 8

    ) {



      state.quote = null;



      dispatch();





      setStatus(



        "O CEP de origem da ELNORA não está configurado corretamente.",



        "error"



      );





      return null;



    }





    /* EVITA CÁLCULOS DUPLICADOS */



    if (state.busy) {



      return null;



    }





    state.busy = true;





    setStatus(



      "Consultando CEP e calculando entrega..."



    );





    try {



      /* ================================================

         PRIMEIRO CONSULTA O DESTINO

         ================================================ */



      const destination =

        await cepData(

          destinationCep

        );





      /* ================================================

         VALIDA ITAPEVI/COTIA ANTES DA ROTA

         ================================================ */



      let validatedCity;





      try {



        validatedCity =

          validateDestinationCep(



            destinationCep,



            destination



          );



      } catch (

        validationError

      ) {



        state.quote = {



          eligible: false,



          reason:

            "delivery-area",



          destination



        };





        setStatus(



          validationError.message,



          "error"



        );





        dispatch();





        return state.quote;



      }





      /* ================================================

         AGORA CONSULTA A ORIGEM

         ================================================ */



      const origin =

        await cepData(

          originCep

        );





      /* ================================================

         CONFERE SE TEMOS COORDENADAS

         ================================================ */



      if (

        !Number.isFinite(

          origin.lat

        ) ||

        !Number.isFinite(

          origin.lon

        )

      ) {



        throw new Error(



          `O CEP de origem ${formatCep(originCep)} foi encontrado, mas não foi possível obter as coordenadas para calcular a rota.`



        );



      }





      if (

        !Number.isFinite(

          destination.lat

        ) ||

        !Number.isFinite(

          destination.lon

        )

      ) {



        throw new Error(



          `O CEP ${formatCep(destinationCep)} foi encontrado em ${destination.city}/${destination.state}, mas não foi possível obter as coordenadas para calcular a rota.`



        );



      }





      /* ================================================

         CALCULA DISTÂNCIA REAL DA IDA

         ================================================ */



      setStatus(



        "CEP confirmado. Calculando distância da entrega..."



      );





      const oneWayKm =

        await routeKm(



          origin,



          destination



        );





      /* ================================================

         LIMITE DE 10 KM NA IDA

         ================================================ */



      if (

        oneWayKm >

        C.maxOneWayKm

      ) {



        state.quote = {



          eligible: false,



          reason:

            "distance",



          validatedCity,



          oneWayKm,



          destination



        };





        setStatus(



          `Fora da área de entrega: ` +



          `${oneWayKm.toFixed(1)} km na ida. ` +



          `O limite da ELNORA é de ${C.maxOneWayKm} km na ida.`,



          "error"



        );





        dispatch();





        return state.quote;



      }





      /* ================================================

         IDA + VOLTA

         ================================================ */



      const roundTripKm =

        oneWayKm * 2;





      /* ================================================

         VALIDA CONFIGURAÇÃO DO VEÍCULO

         ================================================ */



      const consumption =

        Number(

          C.vehicleKmPerLiter

        );





      const fuelPrice =

        Number(

          C.fuelPricePerLiter

        );





      if (

        !Number.isFinite(consumption) ||

        consumption <= 0

      ) {



        throw new Error(



          "O consumo do veículo precisa ser configurado corretamente."



        );



      }





      if (

        !Number.isFinite(fuelPrice) ||

        fuelPrice <= 0

      ) {



        throw new Error(



          "O preço do combustível precisa ser configurado corretamente."



        );



      }





      /* ================================================

         LITROS ESTIMADOS



         litros =

         km ida + volta

         ÷

         km por litro

         ================================================ */



      const liters =

        roundTripKm /

        consumption;





      /* ================================================

         TAXA



         taxa =

         litros

         ×

         preço do combustível

         ================================================ */



      const fee =

        Math.round(



          liters *

          fuelPrice *

          100



        ) / 100;





      /* ================================================

         RESULTADO

         ================================================ */



      state.quote = {



        eligible: true,



        reason:

          "eligible",



        originCep:

          formatCep(originCep),



        destinationCep:

          formatCep(

            destinationCep

          ),



        validatedCity,



        oneWayKm,



        roundTripKm,



        liters,



        fee,



        origin,



        destination



      };





      /* ================================================

         MENSAGEM PARA O CLIENTE

         ================================================ */



      setStatus(



        `${destination.city}/${destination.state}` +



        ` • ${oneWayKm.toFixed(1)} km na ida` +



        ` • ${roundTripKm.toFixed(1)} km ida + volta` +



        ` • ${liters.toFixed(2)} L estimados` +



        ` • Taxa: ${money(fee)}`,



        "success"



      );





      /* ENVIA PARA O CARRINHO */



      dispatch();





      return state.quote;





    } catch (error) {



      console.error(



        "ELNORA — erro no cálculo da entrega:",



        error



      );





      state.quote = null;





      setStatus(



        error?.message ||



        "Não foi possível calcular a entrega neste momento.",



        "error"



      );





      dispatch();





      return null;





    } finally {



      state.busy = false;



    }



  }





  /* =====================================================

     CAMPO CEP

     ===================================================== */



  document.addEventListener(



    "DOMContentLoaded",



    () => {



      const cepElement =

        document.getElementById(

          "delivery-cep"

        );





      if (!cepElement) {



        return;



      }





      let timer = null;





      /* ===============================================

         DIGITAÇÃO

         =============================================== */



      cepElement.addEventListener(



        "input",



        () => {



          /* SOMENTE NÚMEROS */



          const value =

            digits(

              cepElement.value

            );





          /* MÁSCARA CEP */



          cepElement.value =

            value

              .replace(

                /^(\d{5})(\d)/,

                "$1-$2"

              )

              .slice(0, 9);





          /* CANCELA CÁLCULO ANTERIOR */



          clearTimeout(

            timer

          );





          /* LIMPA COTAÇÃO ANTERIOR */



          state.quote = null;





          dispatch();





          /* CEP COMPLETO */



          if (

            digits(

              cepElement.value

            ).length === 8

          ) {



            setStatus(



              "Verificando CEP..."



            );





            timer =

              setTimeout(



                calculate,



                500



              );



          } else {



            setStatus(



              "Aguardando CEP."



            );



          }



        }



      );





      /* ===============================================

         QUANDO SAI DO CAMPO

         =============================================== */



      cepElement.addEventListener(



        "blur",



        () => {



          if (

            digits(

              cepElement.value

            ).length === 8 &&

            !state.quote &&

            !state.busy

          ) {



            calculate();



          }



        }



      );



    }



  );





  /* =====================================================

     DISPONIBILIZA PARA O RESTANTE DO SITE

     ===================================================== */



  window.ELNORA_DELIVERY = {



    state,



    calculate,



    money,



    formatCep,



    cityByCep



  };





})();