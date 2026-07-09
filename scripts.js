class Vehicle {
    constructor({ tipo, modelo, cor, ano, marca, dono, contato, placa, observacoes, tempo }) {
        this.tipo = tipo;
        this.modelo = modelo;
        this.cor = cor;
        this.ano = ano;
        this.marca = marca;
        this.dono = dono;
        this.contato = contato;
        this.placa = placa;
        this.observacoes = observacoes;
        this.tempo = tempo;
    }

    getIcon() {
        return this.tipo === "Moto" ? "🏍️" : "🚗";
    }

    getPrice() {
        const priceMap = {
            30: 1.00,
            60: 1.75,
            120: 3.00
        };

        return priceMap[Number(this.tempo)] || 0;
    }
}

class VehicleCard {
    constructor(vehicle, onFinish) {
        this.vehicle = vehicle;
        this.onFinish = onFinish;
        this.element = document.createElement("article");
        this.element.className = "vehicleCard";
        this.render();
        this.startTimer();
    }

    render() {
        this.element.innerHTML = `
            <button class="vehicleCard__toggle" type="button" aria-expanded="false">
                <div class="vehicleCard__summary">
                    <div class="vehicleCard__icon">${this.vehicle.getIcon()}</div>
                    <div class="vehicleCard__title">
                        <h3>${this.vehicle.modelo}</h3>
                        <p>${this.vehicle.placa}</p>
                    </div>
                    <span class="vehicleCard__badge time-count" data-time="${this.vehicle.tempo}">${this.vehicle.tempo} min</span>
                </div>
            </button>
            <div class="vehicleCard__details">
                <p><span>Tipo</span>${this.vehicle.tipo}</p>
                <p><span>Cor</span>${this.vehicle.cor}</p>
                <p><span>Ano</span>${this.vehicle.ano}</p>
                <p><span>Marca</span>${this.vehicle.marca}</p>
                <p><span>Dono</span>${this.vehicle.dono}</p>
                <p><span>Contato</span>${this.vehicle.contato}</p>
                <p><span>Obs</span>${this.vehicle.observacoes || "Nenhuma"}</p>
                <button class="finishButton" type="button">Finalizar</button>
            </div>
        `;

        this.toggleButton = this.element.querySelector(".vehicleCard__toggle");
        this.toggleButton.addEventListener("click", () => {
            const isOpen = this.element.classList.toggle("is-open");
            this.toggleButton.setAttribute("aria-expanded", String(isOpen));
        });

        this.element.querySelector(".finishButton").addEventListener("click", () => this.onFinish(this.vehicle));
    }

    startTimer() {
        const badge = this.element.querySelector(".time-count");
        const tempoTotal = Number(this.vehicle.tempo) * 60;
        const startTime = Date.now();

        setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            const remainingSeconds = Math.max(tempoTotal - elapsedSeconds, 0);
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;

            badge.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
            badge.style.color = "#ff0000";
        }, 1000);
    }

    getElement() {
        return this.element;
    }
}

class ParkingApp {
    constructor() {
        this.openButton = document.getElementById("OpenCardAdd");
        this.dialog = document.getElementById("addVehicleDialog");
        this.closeButton = document.getElementById("closeDialog");
        this.form = document.getElementById("vehicleForm");
        this.list = document.getElementById("vehiclesList");
        this.vagasCounter = document.getElementById("vagasCounter");
        this.menuButton = document.querySelector(".menu-button");
        this.menu = document.querySelector(".menu");
        this.paymentOverlay = document.getElementById("paymentOverlay");
        this.paymentForm = document.getElementById("paymentForm");
        this.paymentMethod = document.getElementById("paymentMethod");
        this.paymentAmount = document.getElementById("paymentAmount");
        this.paymentSummary = document.getElementById("paymentSummary");
        this.closePayment = document.getElementById("closePayment");
        this.activeVehicle = null;
        this.totalVagas = 90;
        this.ocupadas = 0;
        this.vehicles = [];

        this.initEvents();
        this.updateVagas();
    }

    initEvents() {
        this.openButton.addEventListener("click", () => this.openDialog());
        this.closeButton.addEventListener("click", () => this.closeDialog());
        this.form.addEventListener("submit", (event) => this.handleSubmit(event));
        this.menuButton.addEventListener("click", () => this.toggleMenu());
        this.paymentMethod.addEventListener("change", () => this.updatePaymentSummary());
        this.paymentAmount.addEventListener("input", () => this.updatePaymentSummary());
        this.paymentForm.addEventListener("submit", (event) => this.handlePayment(event));
        this.closePayment.addEventListener("click", () => this.closePaymentModal());
        document.addEventListener("click", (event) => {
            if (!this.menu.contains(event.target)) {
                this.menu.classList.remove("open");
            }
        });
    }

    toggleMenu() {
        this.menu.classList.toggle("open");
    }

    openDialog() {
        this.dialog.showModal();
        this.dialog.classList.add("active");
    }

    closeDialog() {
        this.dialog.close();
        this.dialog.classList.remove("active");
    }

    openPaymentModal(vehicle) {
        this.activeVehicle = vehicle;
        this.paymentOverlay.hidden = false;
        this.paymentOverlay.setAttribute("aria-hidden", "false");
        this.paymentAmount.value = "";
        this.paymentMethod.value = "Dinheiro";
        this.updatePaymentSummary();
    }

    closePaymentModal() {
        this.activeVehicle = null;
        this.paymentOverlay.hidden = true;
        this.paymentOverlay.setAttribute("aria-hidden", "true");
    }

    updatePaymentSummary() {
        const method = this.paymentMethod.value;
        const valor = Number(this.paymentAmount.value || 0);
        const valorEstacionamento = this.activeVehicle ? this.activeVehicle.getPrice() : 0;

        if (method === "Dinheiro") {
            const troco = valor - valorEstacionamento;
            this.paymentSummary.textContent = troco >= 0
                ? `Troco: R$ ${troco.toFixed(2)}`
                : `Faltam R$ ${(Math.abs(troco)).toFixed(2)}`;
        } else if (method === "Cartão") {
            this.paymentSummary.textContent = `Pagamento com cartão: R$ ${valorEstacionamento.toFixed(2)}`;
        } else {
            this.paymentSummary.textContent = `Pagamento via Pix: R$ ${valorEstacionamento.toFixed(2)}`;
        }
    }

    removeVehicle(vehicle) {
        if (vehicle.cardElement) {
            vehicle.cardElement.remove();
        }

        this.vehicles = this.vehicles.filter((item) => item !== vehicle);
        this.ocupadas = this.vehicles.length;
        this.updateVagas();
    }

    handlePayment(event) {
        event.preventDefault();
        if (!this.activeVehicle) return;
 
        const method = this.paymentMethod.value;
        const valorPago = Number(this.paymentAmount.value || 0);
        const valorEstacionamento = this.activeVehicle.getPrice();
 
        if (method === "Dinheiro" && valorPago < valorEstacionamento) {
            alert("Valor insuficiente para concluir o pagamento.");
            return; // Impede a continuação da função
        }
 
        alert(`Pagamento de R$ ${valorEstacionamento.toFixed(2)} concluído para ${this.activeVehicle.modelo}`);
        this.removeVehicle(this.activeVehicle); // Remove o veículo da lista
        this.closePaymentModal(); // Fecha a janela de pagamento
    }

    handleSubmit(event) {
        event.preventDefault();

        const vehicle = new Vehicle({
            tipo: document.getElementById("TypeVehicle").value,
            modelo: document.getElementById("Model").value,
            cor: document.getElementById("Color").value,
            ano: document.getElementById("Year").value,
            marca: document.getElementById("Brand").value,
            dono: document.getElementById("Owner").value,
            contato: document.getElementById("Contact").value,
            placa: document.getElementById("Plate").value,
            observacoes: document.getElementById("vehicleObservation").value,
            tempo: document.getElementById("parkingTime").value
        });

        this.addVehicle(vehicle);
    }

    addVehicle(vehicle) {
        const cardInstance = new VehicleCard(vehicle, (vehicleToFinish) => this.openPaymentModal(vehicleToFinish));
        const card = cardInstance.getElement();
        vehicle.cardElement = card;
        this.vehicles.push(vehicle);
        this.list.appendChild(card);
        this.ocupadas += 1;
        this.updateVagas();
        this.form.reset();
        this.closeDialog();
    }

    updateVagas() {
        const restante = this.totalVagas - this.ocupadas;
        this.vagasCounter.textContent = `${restante}/${this.totalVagas}`;
        this.openButton.disabled = restante <= 0;
        this.openButton.innerHTML = restante <= 0 ? "<h1>Lotado</h1>" : "<h1>+</h1>";
    }
}

const app = new ParkingApp();
