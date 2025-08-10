export enum Material {
    BRICK = "brick", CERAMICS = "ceramics", CONCRETE = "concrete", FABRIC = "fabric", FUR = "fur", GLASS = "glass", GYPSUM = "gypsum", LEATHER = "leather", LIQUID = "liquid", METAL = "metal", ORGANICS = "organics", PAPER = "paper", PLASTIC = "plastic", RATTAN = "rattan", STONE = "stone", WOOD = "wood", }

export enum Style {
    LUXURY = "luxury", INDOCHINE = "indochine", ETHNIC = "ethnic", MODERN = "modern", CLASSIC = "classic", }

export enum Render {
    VRAY_CORONA = "vray+corona", CORONA = "corona", VRAY = "vray", MENTAL_RAY = "mentalray", STANDARD = "standard", }

export enum Form {
    SHAPE = "shape", RHOMBUS = "rhombus", LINE = "line", STAR = "star", HEXAGON = "hexagon", TRIANGLE = "triangle", RECTANGLE = "rectangle", SQUARE = "square", OVAL = "oval", CIRCLE = "circle", }

export enum Form {
    D3_MODEL = "3d_model", TEXTURE = "texture", MATERIAL = "material", SCENE = "scene", PLUGIN = "plugin", OTHER = "other", }

export interface Product {
    _id?: string;
    name: string;
    description?: string;
    price: number;
    discount: number;
    folderId?: string;
    images: string;
    sold: number;
    isActive: boolean;
    rating: number;
    views: number;
    likes: number;
    isPro: boolean;
    size: number;
    materials?: Material;
    style?: Style;
    render?: Render;
    form?: Form;
    color?: string;
    urlDownload?: string;
    createdAt?: string;
    updatedAt?: string;

    categoryId?: string;
    categoryName?: string;
    rootCategoryId?: string;
    categoryPath?: string;
}
