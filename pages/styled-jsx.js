export default () => (
  <div>
    Hello world
    <p>scoped!</p>
    <style jsx>{`
      p {
        color: white;
      }
      div {
        color: white;
        background: red;
      }
      @media (max-width: 600px) {
        p {
          color: white;
        }
        div {
          background: blue;
        }
      }
    `}
    </style>
    <style global jsx>{`
      body {
        background: black;
      }
    `}
    </style>
  </div>
);
