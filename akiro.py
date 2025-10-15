from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import time
import json

options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

url = "https://loja.neemo.com.br/akiro-sushi-sao-goncalo"
driver.get(url)
time.sleep(5)

# XPath para pegar divs com atributo data-test que começa com 'item-'
produtos = driver.find_elements(By.XPATH, "//div[starts-with(@data-test, 'item-')]")
print(f"Produtos encontrados: {len(produtos)}")

produtos_data = []

for i, produto in enumerate(produtos, start=1):
    try:
        nome = produto.find_element(By.CLASS_NAME, "css-157g16v").text.strip()
    except:
        nome = "Sem nome"

    try:
        descricao = produto.find_element(By.CLASS_NAME, "css-1banjbe").text.strip()
    except:
        descricao = "Sem descrição"

    try:
        precos = produto.find_elements(By.CLASS_NAME, "css-1kskfr8")
        preco = "Sem preço"
        for p in precos:
            text = p.text.strip()
            if text.startswith("R$"):
                preco = text
                break
    except:
        preco = "Sem preço"

    try:
        imagem = produto.find_element(By.TAG_NAME, "img").get_attribute("src")
    except:
        imagem = "Sem imagem"

    print(f"\nProduto {i}:")
    print(f"Nome: {nome}")
    print(f"Descrição: {descricao}")
    print(f"Preço: {preco}")
    print(f"Imagem: {imagem}")

    produtos_data.append({
        "nome": nome,
        "descricao": descricao,
        "preco": preco,
        "imagem": imagem
    })

driver.quit()

with open("catalogo_akiro.json", "w", encoding="utf-8") as f:
    json.dump(produtos_data, f, ensure_ascii=False, indent=2)

print("\nScraping finalizado e arquivo salvo: catalogo_akiro.json")
