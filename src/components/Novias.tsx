import eterna from "@/assets/product-novia-eterna.webp";
import jardin from "@/assets/product-novia-jardin.webp";
import minimal from "@/assets/product-novia-minimal.webp";

const bouquets = [
  { name: "Eterna", desc: "Peonías y rosas garden en marfil", price: "Desde S/. 480", img: eterna },
  { name: "Jardín", desc: "Cascada de rosas blush y jazmín", price: "Desde S/. 520", img: jardin },
  { name: "Minimal", desc: "Anémonas blancas y tulipanes", price: "Desde S/. 420", img: minimal },
];

export function Novias() {
  return (
    <section id="novias" className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-12 md:mb-16">
          <div className="lg:col-span-7">
            <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
              — el gran día
            </p>
            <h2 className="font-display text-foreground text-4xl md:text-5xl lg:text-6xl leading-tight">
              Bridal Atelier
              <span className="block font-italic-serif text-foreground/80 text-2xl md:text-3xl mt-3">
                Bouquets diseñados para tu boda.
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="font-body font-light text-foreground/80 text-base md:text-lg leading-relaxed">
              Agendamos una asesoría privada en boutique para diseñar tu ramo, los arreglos de
              iglesia y la decoración del banquete. Cada propuesta es única y se trabaja con un mes
              de anticipación.
            </p>
            <a
              href="https://wa.me/51999999999"
              className="mt-6 inline-flex items-center justify-center h-12 px-8 bg-foreground text-primary-foreground text-[11px] tracking-wider-2 uppercase font-body font-light hover:bg-foreground/90 transition-colors duration-300"
            >
              Reservar asesoría
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {bouquets.map((b) => (
            <article
              key={b.name}
              className="group flex flex-col w-full max-w-[340px] mx-auto md:mx-0"
            >
              <div
                className="relative overflow-hidden bg-ivory-soft"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={b.img}
                  alt={`Bouquet de novia ${b.name}`}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="pt-5">
                <p className="text-[10px] tracking-wider-2 uppercase font-body font-light text-muted-foreground">
                  Bridal Atelier
                </p>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="font-display italic text-2xl text-foreground">{b.name}</h3>
                  <span className="font-body font-light text-foreground text-sm">{b.price}</span>
                </div>
                <p className="mt-2 font-italic-serif text-foreground/70">{b.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
