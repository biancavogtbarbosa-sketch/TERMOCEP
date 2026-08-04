/* ============================================
   TERMOCEP - simulador.js
   Simulador educacional de aquecimento solar
   ============================================ */

(() => {
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const CALOR_ESPECIFICO_AGUA = 4186; // J/kg°C
  const JOULE_PARA_KWH = 3600000; // 1 kWh = 3.600.000 J

  const MATERIAIS = {
    "preto-seletivo": {
      nome: "Preto seletivo",
      absorcao: 95,
      reflexao: 5,
      eficiencia: 85,
      desc: "Superfícies seletivas tendem a absorver bem a radiação solar e podem perder menos calor por emissão térmica."
    },
    "preto-fosco": {
      nome: "Preto fosco",
      absorcao: 90,
      reflexao: 10,
      eficiencia: 70,
      desc: "Boa absorção de radiação, sendo uma opção comum em propostas educacionais de coletores."
    },
    "azul-escuro": {
      nome: "Azul-escuro",
      absorcao: 80,
      reflexao: 20,
      eficiencia: 60,
      desc: "Absorve menos que superfícies pretas, mas ainda pode ter desempenho razoável dependendo do projeto."
    },
    "cinza": {
      nome: "Cinza",
      absorcao: 70,
      reflexao: 30,
      eficiencia: 50,
      desc: "Reflexão maior que superfícies escuras, reduzindo parte do aproveitamento térmico."
    },
    "branco": {
      nome: "Branco",
      absorcao: 35,
      reflexao: 65,
      eficiencia: 25,
      desc: "Reflete grande parte da radiação visível, sendo geralmente menos eficiente para aquecimento."
    }
  };

  const PERDAS = {
    baixa: 0.92,
    media: 0.82,
    alta: 0.70
  };

  function init() {
    const form = $("formSimulador");
    if (!form) return;

    renderGrafico();
    renderTabela();
    updateComparador();
    updateSimulador();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function bindEvents() {
    const simInputs = [
      "area",
      "irradiacao",
      "volume",
      "tempInicial",
      "tempDesejada",
      "materialColetor",
      "cobertura",
      "perda"
    ];

    simInputs.forEach((id) => {
      const el = $(id);
      if (!el) return;

      el.addEventListener("input", updateSimulador);
      el.addEventListener("change", updateSimulador);
    });

    const comparador = $("materialComparador");
    const simuladorMaterial = $("materialColetor");

    if (comparador) {
      comparador.addEventListener("change", () => {
        if (simuladorMaterial) {
          simuladorMaterial.value = comparador.value;
        }
        updateComparador();
        updateSimulador();
      });
    }

    if (simuladorMaterial) {
      simuladorMaterial.addEventListener("change", () => {
        if (comparador) {
          comparador.value = simuladorMaterial.value;
        }
        updateComparador();
        updateSimulador();
      });
    }
  }

  function formatar(valor, casas = 1) {
    return Number(valor).toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    });
  }

  function setMetric(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function renderGrafico() {
    const chart = $("chartBars");
    if (!chart) return;

    chart.innerHTML = "";

    Object.entries(MATERIAIS).forEach(([key, item]) => {
      const itemEl = document.createElement("div");
      itemEl.className = "bar-item";
      itemEl.dataset.material = key;

      itemEl.innerHTML = `
        <div class="bar-label">
          <span>${item.nome}</span>
          <strong>${item.eficiencia}%</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${item.eficiencia}%"></div>
        </div>
      `;

      chart.appendChild(itemEl);
    });

    chart.setAttribute(
      "aria-label",
      "Gráfico de barras comparando eficiência estimada: " +
        Object.values(MATERIAIS)
          .map((item) => `${item.nome} ${item.eficiencia}%`)
          .join(", ")
    );
  }

  function renderTabela() {
    const tbody = $("tabelaMateriaisBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    Object.entries(MATERIAIS).forEach(([key, item]) => {
      const tr = document.createElement("tr");
      tr.dataset.material = key;

      tr.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.absorcao}%</td>
        <td>${item.reflexao}%</td>
        <td>${item.eficiencia}%</td>
      `;

      tbody.appendChild(tr);
    });
  }

  function highlightMaterial(key) {
    $$(".bar-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.material === key);
    });

    $$("#tabelaMateriaisBody tr").forEach((row) => {
      row.classList.toggle("active-row", row.dataset.material === key);
    });
  }

  function updateComparador() {
    const select = $("materialComparador");
    if (!select) return;

    const material = MATERIAIS[select.value] || MATERIAIS["preto-seletivo"];

    if ($("compAbs")) $("compAbs").textContent = `${material.absorcao}%`;
    if ($("compRefl")) $("compRefl").textContent = `${material.reflexao}%`;
    if ($("compEf")) $("compEf").textContent = `${material.eficiencia}%`;
    if ($("compDesc")) $("compDesc").textContent = material.desc;

    highlightMaterial(select.value);
  }

  function updateSimulador() {
    const areaEl = $("area");
    const irradiacaoEl = $("irradiacao");
    const volumeEl = $("volume");
    const tempInicialEl = $("tempInicial");
    const tempDesejadaEl = $("tempDesejada");
    const materialEl = $("materialColetor");
    const coberturaEl = $("cobertura");
    const perdaEl = $("perda");
    const resMsg = $("resMsg");

    if (!areaEl || !irradiacaoEl || !volumeEl || !tempInicialEl || !tempDesejadaEl || !materialEl) {
      return;
    }

    const area = Number(areaEl.value);
    const irradiacao = Number(irradiacaoEl.value);
    const volume = Number(volumeEl.value);
    const tempInicial = Number(tempInicialEl.value);
    const tempDesejada = Number(tempDesejadaEl.value);
    const cobertura = coberturaEl ? coberturaEl.checked : true;
    const perdaKey = perdaEl ? perdaEl.value : "baixa";

    if ($("areaOut")) $("areaOut").textContent = formatar(area, 0);
    if ($("irradiacaoOut")) $("irradiacaoOut").textContent = formatar(irradiacao, 1);
    if ($("volumeOut")) $("volumeOut").textContent = formatar(volume, 0);
    if ($("tempInicialOut")) $("tempInicialOut").textContent = formatar(tempInicial, 0);
    if ($("tempDesejadaOut")) $("tempDesejadaOut").textContent = formatar(tempDesejada, 0);

    if (tempDesejada <= tempInicial) {
      ["resEnergia", "resSolarDia", "resDias", "resEconomia"].forEach((id) => {
        setMetric(id, "--");
      });

      if ($("resComparacao")) $("resComparacao").textContent = "";

      if (resMsg) {
        resMsg.className = "form-feedback error";
        resMsg.textContent = "A temperatura desejada deve ser maior que a temperatura inicial.";
      }
      return;
    }

    if (resMsg) {
      resMsg.className = "form-feedback";
      resMsg.textContent = "";
    }

    const deltaT = tempDesejada - tempInicial;

    /*
      Fórmula educacional:
      1 litro de água ≈ 1 kg
      Q = massa * calor específico * variação de temperatura
      Depois convertemos joules para kWh.
    */
    const massaKg = volume;
    const energiaJ = massaKg * CALOR_ESPECIFICO_AGUA * deltaT;
    const energiaKWh = energiaJ / JOULE_PARA_KWH;

    const material = MATERIAIS[materialEl.value] || MATERIAIS["preto-seletivo"];
    const fatorPerda = PERDAS[perdaKey] || 0.8;
    const fatorCobertura = cobertura ? 1 : 0.85;

    /*
      Energia solar útil estimada por dia:
      E = área * irradiação * eficiência do coletor * fatores de perda/cobertura
    */
    const energiaSolarDia =
      area * irradiacao * (material.eficiencia / 100) * fatorPerda * fatorCobertura;

    /*
      Dias estimados:
      dias = energia necessária / energia útil por dia
    */
    const dias = energiaSolarDia > 0 ? energiaKWh / energiaSolarDia : Infinity;

    /*
      Economia potencial:
      Consideramos didaticamente a energia elétrica equivalente que poderia
      ser evitada se o aquecimento fosse substituído por energia solar térmica.
    */
    const energiaEletricaEvitada = energiaKWh / 0.95;

    const melhorMaterial = Object.values(MATERIAIS).reduce((max, item) => {
      return item.eficiencia > max.eficiencia ? item : max;
    }, MATERIAIS["preto-seletivo"]);

    const melhorDias =
      energiaKWh /
      (area * irradiacao * (melhorMaterial.eficiencia / 100) * fatorPerda * fatorCobertura);

    setMetric("resEnergia", `${formatar(energiaKWh, 1)} kWh`);
    setMetric("resSolarDia", `${formatar(energiaSolarDia, 1)} kWh/dia`);
    setMetric("resDias", Number.isFinite(dias) ? `${formatar(dias, 1)} dias` : "--");
    setMetric("resEconomia", `até ${formatar(energiaEletricaEvitada, 1)} kWh`);

    if ($("resComparacao")) {
      $("resComparacao").textContent =
        `Comparação: com ${melhorMaterial.nome}, a estimativa seria de ` +
        `${formatar(melhorDias, 1)} dias nas mesmas condições.`;
    }

    highlightMaterial(materialEl.value);
  }
})();
