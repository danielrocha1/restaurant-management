import { useState } from "react";
import { Card, Button } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useCart } from "../context/cartContext";
import "./product.css";

const ProductCard = ({ product }) => {
  // Define o peso padrão como "Único" se não houver pesos definidos
  const defaultWeight =
    Array.isArray(product.weights) && product.weights.length > 0
      ? product.weights[0]
      : "Único";

  const [selectedWeight, setSelectedWeight] = useState(defaultWeight);
  const { addToCart, removeFromCart, getQuantity } = useCart();

  const quantity = getQuantity(product.nome, selectedWeight);

  const handleAdd = () => addToCart(product, selectedWeight);
  const handleIncrease = () => addToCart(product, selectedWeight);
  const handleDecrease = () => removeFromCart(product.nome, selectedWeight);

  return (
    <Card className="product-card" hoverable>
      <img src={product.imagem} alt={product.nome} className="product-image" />
      <div className="product-info">
        <h2 className="product-title">{product.nome}</h2>

        {/* Renderiza os pesos apenas se existirem */}
        {Array.isArray(product.weights) && product.weights.length > 0 ? (
          <div className="weight-options">
            {product.weights.map((weight) => (
              <div
                key={weight}
                onClick={() => setSelectedWeight(weight)}
                className={`weight-option ${
                  selectedWeight === weight ? "selected" : ""
                }`}
              >
                {weight}
              </div>
            ))}
          </div>
        ) : null}

        <div className="product-price">{product.preco}</div>

        <div
          className={`cart-controls ${
            quantity > 0 ? "expanded" : "collapsed"
          }`}
        >
          {quantity === 0 ? (
            <Button onClick={handleAdd} className="add-to-cart">
              Adicionar ao Carrinho
            </Button>
          ) : (
            <div className="quantity-controls">
              <Button
                onClick={handleDecrease}
                className="quantity-button"
                icon={<MinusOutlined />}
                shape="circle"
              />
              <span className="quantity-value">{quantity}</span>
              <Button
                onClick={handleIncrease}
                className="quantity-button"
                icon={<PlusOutlined />}
                shape="circle"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
