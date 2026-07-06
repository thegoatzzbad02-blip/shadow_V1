(function () {
    function generateLuhnNumber(prefix) {
        let digits = prefix || '';
        while (digits.length < 15) digits += Math.floor(Math.random() * 10);
        let sum = 0;
        let alternate = true;
        for (let i = digits.length - 1; i >= 0; i -= 1) {
            let n = parseInt(digits[i], 10);
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        const checksum = (10 - (sum % 10)) % 10;
        return digits + checksum;
    }

    function generateFullCard(bin = '') {
        const bins = ['411111', '555555', '378282', '601111', '352800', '222100'];
        const prefix = bin || bins[Math.floor(Math.random() * bins.length)];
        const cardNumber = generateLuhnNumber(prefix);
        const formatted = cardNumber.match(/.{1,4}/g).join(' ');
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const year = String(Math.floor(Math.random() * 5) + 25);
        const expiry = `${month}/${year}`;
        const cvv = String(Math.floor(Math.random() * 900) + 100);
        const names = ['BRUCE WAYNE', 'PETER PARKER', 'CLARK KENT', 'TONY STARK', 'STEVE ROGERS', 'NATASHA ROMANOFF'];
        return { number: formatted, raw: cardNumber, expiry, cvv, name: names[Math.floor(Math.random() * names.length)] };
    }

    function updatePreview(card) {
        const cardNumberEl = document.getElementById('cardNumber');
        const cardExpiryEl = document.getElementById('cardExpiry');
        const cardNameEl = document.getElementById('cardName');
        const cardCvvEl = document.getElementById('cardCvv');
        if (cardNumberEl) cardNumberEl.textContent = card.number;
        if (cardExpiryEl) cardExpiryEl.textContent = card.expiry;
        if (cardNameEl) cardNameEl.textContent = card.name;
        if (cardCvvEl) cardCvvEl.textContent = card.cvv;
    }

    function generateCards() {
        const binInput = document.getElementById('binInput');
        const cantidadInput = document.getElementById('cantidadInput');
        const resultDiv = document.getElementById('generadorResult');
        if (!resultDiv) return;

        const bin = (binInput?.value || '').trim();
        const cantidad = parseInt(cantidadInput?.value || '5', 10);
        let html = '<div class="generador-cards">';
        for (let i = 0; i < cantidad; i += 1) {
            const card = generateFullCard(bin);
            html += `
                <div class="card-item" onclick="window.copyCardItem(this, '${card.raw}')">
                    <div class="card-number">${card.number}</div>
                    <div class="card-details"><span>Exp: ${card.expiry}</span><span>CVV: ${card.cvv}</span></div>
                    <div class="card-copy"><i class="fas fa-copy"></i></div>
                </div>`;
        }
        html += '</div>';
        resultDiv.innerHTML = html;
    }

    function copyCardItem(element, cardNumber) {
        const icon = element.querySelector('.card-copy i');
        navigator.clipboard.writeText(cardNumber).then(() => {
            if (icon) {
                icon.className = 'fas fa-check';
                icon.style.color = '#22d3ee';
                setTimeout(() => {
                    icon.className = 'fas fa-copy';
                    icon.style.color = '';
                }, 2000);
            }
        }).catch(() => {
            const range = document.createRange();
            range.selectNode(element.querySelector('.card-number'));
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            if (icon) {
                icon.className = 'fas fa-check';
                icon.style.color = '#22d3ee';
                setTimeout(() => {
                    icon.className = 'fas fa-copy';
                    icon.style.color = '';
                }, 2000);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const generarBtn = document.getElementById('generarBtn');
        const binInput = document.getElementById('binInput');
        if (generarBtn) generarBtn.addEventListener('click', generateCards);
        if (binInput) {
            binInput.addEventListener('input', () => {
                updatePreview(generateFullCard(binInput.value.trim()));
            });
        }
        updatePreview(generateFullCard());
        generateCards();
    });

    window.copyCardItem = copyCardItem;
})();
