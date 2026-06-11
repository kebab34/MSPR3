import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  PageHeader,
  Card,
  StatCard,
  Badge,
  Btn,
  Input,
  Select,
  Alert,
  Skeleton,
  EmptyState,
} from "@/components/ui";

// ─── PageHeader ────────────────────────────────────────────────────────────────
describe("PageHeader", () => {
  it("affiche le titre", () => {
    render(<PageHeader title="Tableau de bord" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tableau de bord");
  });

  it("affiche le sous-titre quand fourni", () => {
    render(<PageHeader title="Titre" subtitle="Sous-titre explicatif" />);
    expect(screen.getByText("Sous-titre explicatif")).toBeInTheDocument();
  });

  it("n'affiche pas de sous-titre quand absent", () => {
    render(<PageHeader title="Titre" />);
    expect(screen.queryByText(/sous-titre/i)).not.toBeInTheDocument();
  });

  it("affiche l'action quand fournie", () => {
    render(<PageHeader title="Titre" action={<button>Ajouter</button>} />);
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
  });
});

// ─── Card ──────────────────────────────────────────────────────────────────────
describe("Card", () => {
  it("rend ses enfants", () => {
    render(<Card><p>Contenu</p></Card>);
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });

  it("applique une className supplémentaire", () => {
    const { container } = render(<Card className="extra-class">X</Card>);
    expect(container.firstChild).toHaveClass("extra-class");
  });
});

// ─── StatCard ─────────────────────────────────────────────────────────────────
describe("StatCard", () => {
  it("affiche le label et la valeur", () => {
    render(<StatCard label="Utilisateurs" value={42} />);
    expect(screen.getByText("Utilisateurs")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("affiche le sous-texte quand fourni", () => {
    render(<StatCard label="Sessions" value={12} sub="+3 cette semaine" />);
    expect(screen.getByText("+3 cette semaine")).toBeInTheDocument();
  });

  it("n'affiche pas de sous-texte quand absent", () => {
    render(<StatCard label="Sessions" value={12} />);
    expect(screen.queryByText(/cette semaine/i)).not.toBeInTheDocument();
  });

  it("accepte une valeur de type string", () => {
    render(<StatCard label="Score" value="98 %" />);
    expect(screen.getByText("98 %")).toBeInTheDocument();
  });
});

// ─── Badge ─────────────────────────────────────────────────────────────────────
describe("Badge", () => {
  it("affiche son texte", () => {
    render(<Badge>Actif</Badge>);
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("utilise le variant slate par défaut", () => {
    const { container } = render(<Badge>Texte</Badge>);
    expect(container.firstChild).toHaveClass("bg-slate-800");
  });

  it("applique le variant blue", () => {
    const { container } = render(<Badge variant="blue">Info</Badge>);
    expect(container.firstChild).toHaveClass("bg-blue-500/10");
  });
});

// ─── Btn ───────────────────────────────────────────────────────────────────────
describe("Btn", () => {
  it("rend un bouton avec le texte", () => {
    render(<Btn>Envoyer</Btn>);
    expect(screen.getByRole("button", { name: /Envoyer/i })).toBeInTheDocument();
  });

  it("appelle onClick au clic", () => {
    const handleClick = jest.fn();
    render(<Btn onClick={handleClick}>Clic</Btn>);
    fireEvent.click(screen.getByRole("button", { name: /Clic/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("est désactivé quand disabled=true", () => {
    render(<Btn disabled>Bloqué</Btn>);
    expect(screen.getByRole("button", { name: /Bloqué/i })).toBeDisabled();
  });

  it("est désactivé quand loading=true", () => {
    render(<Btn loading>Chargement</Btn>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("affiche un spinner en état loading", () => {
    const { container } = render(<Btn loading>Chargement</Btn>);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("a type=submit quand spécifié", () => {
    render(<Btn type="submit">Soumettre</Btn>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("applique la variante danger", () => {
    const { container } = render(<Btn variant="danger">Supprimer</Btn>);
    expect(container.firstChild).toHaveClass("bg-red-600/20");
  });
});

// ─── Input ─────────────────────────────────────────────────────────────────────
describe("Input", () => {
  it("affiche un champ input", () => {
    render(<Input placeholder="Entrez votre nom" />);
    expect(screen.getByPlaceholderText("Entrez votre nom")).toBeInTheDocument();
  });

  it("affiche un label quand fourni", () => {
    render(<Input label="Nom" />);
    expect(screen.getByText("Nom")).toBeInTheDocument();
  });

  it("n'affiche pas de label quand absent", () => {
    render(<Input placeholder="sans label" />);
    expect(screen.queryByRole("label")).not.toBeInTheDocument();
  });

  it("accepte la saisie utilisateur", () => {
    render(<Input defaultValue="" />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test@email.com" } });
    expect(input.value).toBe("test@email.com");
  });

  it("est désactivé quand disabled=true", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

// ─── Select ────────────────────────────────────────────────────────────────────
describe("Select", () => {
  it("affiche les options", () => {
    render(
      <Select label="Genre">
        <option value="Male">Homme</option>
        <option value="Female">Femme</option>
      </Select>
    );
    expect(screen.getByText("Homme")).toBeInTheDocument();
    expect(screen.getByText("Femme")).toBeInTheDocument();
  });

  it("affiche un label quand fourni", () => {
    render(<Select label="Pays"><option>France</option></Select>);
    expect(screen.getByText("Pays")).toBeInTheDocument();
  });

  it("change de valeur à la sélection", () => {
    render(
      <Select defaultValue="Male">
        <option value="Male">Homme</option>
        <option value="Female">Femme</option>
      </Select>
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "Female" } });
    expect(select.value).toBe("Female");
  });
});

// ─── Alert ─────────────────────────────────────────────────────────────────────
describe("Alert", () => {
  it("affiche le message", () => {
    render(<Alert>Opération réussie</Alert>);
    expect(screen.getByText("Opération réussie")).toBeInTheDocument();
  });

  it("applique les classes success", () => {
    const { container } = render(<Alert variant="success">OK</Alert>);
    expect(container.firstChild).toHaveClass("bg-emerald-500/10");
  });

  it("applique les classes error", () => {
    const { container } = render(<Alert variant="error">Erreur</Alert>);
    expect(container.firstChild).toHaveClass("bg-red-500/10");
  });

  it("applique les classes warning", () => {
    const { container } = render(<Alert variant="warning">Attention</Alert>);
    expect(container.firstChild).toHaveClass("bg-amber-500/10");
  });

  it("utilise info par défaut", () => {
    const { container } = render(<Alert>Info</Alert>);
    expect(container.firstChild).toHaveClass("bg-blue-500/10");
  });
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────
describe("Skeleton", () => {
  it("rend un div animé", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("applique une className personnalisée", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    expect(container.firstChild).toHaveClass("h-4", "w-20");
  });
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
describe("EmptyState", () => {
  it("affiche le message", () => {
    render(<EmptyState message="Aucun résultat trouvé" />);
    expect(screen.getByText("Aucun résultat trouvé")).toBeInTheDocument();
  });

  it("affiche l'action quand fournie", () => {
    render(<EmptyState message="Vide" action={<button>Créer</button>} />);
    expect(screen.getByRole("button", { name: "Créer" })).toBeInTheDocument();
  });

  it("n'affiche pas d'action quand absente", () => {
    render(<EmptyState message="Vide" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
