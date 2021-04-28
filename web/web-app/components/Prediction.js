export const Prediction = ({ prediction }) => {
  return (
    <>
      <div>{prediction[0].toPrecision(3)}</div>
      <div>{prediction[1].toPrecision(3)}</div>
      <div>{prediction[2].toPrecision(3)}</div>
      <div>{prediction[3].toPrecision(3)}</div>
    </>
  );
}
