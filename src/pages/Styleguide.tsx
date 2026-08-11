import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Info, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Styleguide = () => {
  const [darkMode, setDarkMode] = useState(false);

  const colorTokens = [
    { name: '--primary', label: 'Primary', value: 'hsl(0 72% 51%)', usage: 'Botões principais, links, elementos de destaque' },
    { name: '--primary-foreground', label: 'Primary Foreground', value: 'hsl(0 0% 100%)', usage: 'Texto sobre fundos primários' },
    { name: '--secondary', label: 'Secondary', value: 'hsl(0 0% 20%)', usage: 'Fundos escuros, footer, elementos de contraste' },
    { name: '--secondary-foreground', label: 'Secondary Foreground', value: 'hsl(0 0% 100%)', usage: 'Texto sobre fundos secundários' },
    { name: '--accent', label: 'Accent', value: 'hsl(0 72% 60%)', usage: 'Elementos de destaque secundários' },
    { name: '--accent-foreground', label: 'Accent Foreground', value: 'hsl(0 0% 100%)', usage: 'Texto sobre accent' },
    { name: '--background', label: 'Background', value: 'hsl(0 0% 98%)', usage: 'Fundo da página' },
    { name: '--foreground', label: 'Foreground', value: 'hsl(0 0% 15%)', usage: 'Texto principal' },
    { name: '--muted', label: 'Muted', value: 'hsl(0 0% 96%)', usage: 'Fundos suaves, separadores' },
    { name: '--muted-foreground', label: 'Muted Foreground', value: 'hsl(0 0% 45%)', usage: 'Texto secundário, placeholders' },
    { name: '--card', label: 'Card', value: 'hsl(0 0% 100%)', usage: 'Fundo de cards' },
    { name: '--card-foreground', label: 'Card Foreground', value: 'hsl(0 0% 15%)', usage: 'Texto em cards' },
    { name: '--border', label: 'Border', value: 'hsl(0 0% 90%)', usage: 'Bordas de elementos' },
  ];

  const semanticColors = [
    { name: '--success', label: 'Success', value: 'hsl(142 71% 45%)', usage: 'Estados de sucesso, confirmações' },
    { name: '--warning', label: 'Warning', value: 'hsl(45 93% 47%)', usage: 'Avisos, alertas de atenção' },
    { name: '--destructive', label: 'Destructive', value: 'hsl(0 84% 60%)', usage: 'Erros, ações destrutivas' },
    { name: '--info', label: 'Info', value: 'hsl(210 100% 50%)', usage: 'Informações, dicas' },
  ];

  const chartColors = [
    { name: '--chart-1', label: 'Chart 1', value: 'hsl(0 72% 51%)' },
    { name: '--chart-2', label: 'Chart 2', value: 'hsl(0 0% 30%)' },
    { name: '--chart-3', label: 'Chart 3', value: 'hsl(0 72% 70%)' },
    { name: '--chart-4', label: 'Chart 4', value: 'hsl(0 0% 50%)' },
    { name: '--chart-5', label: 'Chart 5', value: 'hsl(0 50% 40%)' },
  ];

  const sidebarColors = [
    { name: '--sidebar-background', label: 'Sidebar BG', value: 'hsl(0 72% 45%)' },
    { name: '--sidebar-foreground', label: 'Sidebar FG', value: 'hsl(0 0% 100%)' },
    { name: '--sidebar-primary', label: 'Sidebar Primary', value: 'hsl(0 0% 100%)' },
    { name: '--sidebar-accent', label: 'Sidebar Accent', value: 'hsl(0 72% 55%)' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="container-section py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Design System</h1>
                  <p className="text-sm text-muted-foreground">Styleguide - Tema Vermelho CRIS</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>
          </div>
        </header>

        <main className="container-section py-8 space-y-12">
          {/* Design Summary */}
          <section>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-4 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Cor Primária</h3>
                    <p className="text-primary-foreground/80">#E53935 (Vermelho)</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tipografia</h3>
                    <p className="text-primary-foreground/80">Metropolis / Inter</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Estilo</h3>
                    <p className="text-primary-foreground/80">Bold, Moderno, Geométrico</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Border Radius</h3>
                    <p className="text-primary-foreground/80">0.5rem (8px)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="colors">Cores</TabsTrigger>
              <TabsTrigger value="typography">Tipografia</TabsTrigger>
              <TabsTrigger value="components">Componentes</TabsTrigger>
              <TabsTrigger value="forms">Formulários</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-8">
              {/* Primary Colors */}
              <section>
                <h2 className="text-xl font-bold mb-4">Cores Primárias</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colorTokens.map((color) => (
                    <Card key={color.name} className="overflow-hidden">
                      <div 
                        className="h-20 flex items-end p-3" 
                        style={{ backgroundColor: `var(${color.name})` }}
                      >
                        <span 
                          className="text-xs font-mono px-2 py-1 rounded bg-background/90 text-foreground"
                        >
                          {color.name}
                        </span>
                      </div>
                      <CardContent className="pt-3">
                        <p className="font-semibold text-sm">{color.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Semantic Colors */}
              <section>
                <h2 className="text-xl font-bold mb-4">Cores Semânticas</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {semanticColors.map((color) => (
                    <Card key={color.name} className="overflow-hidden">
                      <div 
                        className="h-16 flex items-end p-3" 
                        style={{ backgroundColor: `var(${color.name})` }}
                      >
                        <span className="text-xs font-mono px-2 py-1 rounded bg-background/90 text-foreground">
                          {color.name}
                        </span>
                      </div>
                      <CardContent className="pt-3">
                        <p className="font-semibold text-sm">{color.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Chart Colors */}
              <section>
                <h2 className="text-xl font-bold mb-4">Cores para Gráficos</h2>
                <div className="flex gap-2 flex-wrap">
                  {chartColors.map((color) => (
                    <div key={color.name} className="text-center">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm" 
                        style={{ backgroundColor: `var(${color.name})` }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">{color.label}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sidebar Colors */}
              <section>
                <h2 className="text-xl font-bold mb-4">Cores do Sidebar</h2>
                <div className="flex gap-2 flex-wrap">
                  {sidebarColors.map((color) => (
                    <div key={color.name} className="text-center">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-sm border" 
                        style={{ backgroundColor: `var(${color.name})` }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">{color.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-4">Hierarquia de Títulos</h2>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">h1 - 3rem / 48px</p>
                      <h1 className="text-5xl font-bold">Título Principal</h1>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">h2 - 2.25rem / 36px</p>
                      <h2 className="text-4xl font-bold">Título Secundário</h2>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">h3 - 1.875rem / 30px</p>
                      <h3 className="text-3xl font-semibold">Título de Secção</h3>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">h4 - 1.5rem / 24px</p>
                      <h4 className="text-2xl font-semibold">Subtítulo</h4>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">h5 - 1.25rem / 20px</p>
                      <h5 className="text-xl font-medium">Título de Card</h5>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">h6 - 1rem / 16px</p>
                      <h6 className="text-lg font-medium">Label</h6>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">Texto Corpo</h2>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Base - 1rem / 16px</p>
                      <p className="text-base">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Small - 0.875rem / 14px</p>
                      <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">XSmall - 0.75rem / 12px</p>
                      <p className="text-xs text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-8">
              {/* Buttons */}
              <section>
                <h2 className="text-xl font-bold mb-4">Botões</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-center">
                      <Button>Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link</Button>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center mt-4">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button disabled>Disabled</Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Badges */}
              <section>
                <h2 className="text-xl font-bold mb-4">Badges</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge className="bg-success text-success-foreground">Success</Badge>
                      <Badge className="bg-warning text-warning-foreground">Warning</Badge>
                      <Badge className="bg-info text-info-foreground">Info</Badge>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Cards */}
              <section>
                <h2 className="text-xl font-bold mb-4">Cards</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Simples</CardTitle>
                      <CardDescription>Descrição do card</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Conteúdo do card com informação relevante.</p>
                    </CardContent>
                  </Card>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle>Card Hover</CardTitle>
                      <CardDescription>Com efeito de hover</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Passa o cursor para ver o efeito.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle>Card Destacado</CardTitle>
                      <CardDescription>Com borda primária</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Para elementos importantes.</p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </TabsContent>

            {/* Forms Tab */}
            <TabsContent value="forms" className="space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-4">Campos de Formulário</h2>
                <Card>
                  <CardContent className="pt-6 space-y-6 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="input-example">Input de Texto</Label>
                      <Input id="input-example" placeholder="Escreva aqui..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="textarea-example">Textarea</Label>
                      <Textarea id="textarea-example" placeholder="Mensagem..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-example">Select</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar opção" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Opção 1</SelectItem>
                          <SelectItem value="2">Opção 2</SelectItem>
                          <SelectItem value="3">Opção 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="switch-example" />
                      <Label htmlFor="switch-example">Switch Toggle</Label>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent value="feedback" className="space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-4">Alertas</h2>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Informação</AlertTitle>
                    <AlertDescription>Este é um alerta informativo para dar contexto ao utilizador.</AlertDescription>
                  </Alert>
                  <Alert className="border-success bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <AlertTitle className="text-success">Sucesso</AlertTitle>
                    <AlertDescription>A operação foi concluída com sucesso.</AlertDescription>
                  </Alert>
                  <Alert className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertTitle className="text-warning">Aviso</AlertTitle>
                    <AlertDescription>Atenção: Esta ação requer confirmação.</AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>Ocorreu um erro ao processar o pedido.</AlertDescription>
                  </Alert>
                </div>
              </section>

              {/* Border Radius */}
              <section>
                <h2 className="text-xl font-bold mb-4">Border Radius</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-sm" />
                        <p className="text-xs text-muted-foreground mt-2">sm (2px)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-md" />
                        <p className="text-xs text-muted-foreground mt-2">md (6px)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-lg" />
                        <p className="text-xs text-muted-foreground mt-2">lg (8px)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-xl" />
                        <p className="text-xs text-muted-foreground mt-2">xl (12px)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-full" />
                        <p className="text-xs text-muted-foreground mt-2">full</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Shadows */}
              <section>
                <h2 className="text-xl font-bold mb-4">Sombras</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-8">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-card rounded-lg shadow-sm" />
                        <p className="text-xs text-muted-foreground mt-2">shadow-sm</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-card rounded-lg shadow" />
                        <p className="text-xs text-muted-foreground mt-2">shadow</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-card rounded-lg shadow-md" />
                        <p className="text-xs text-muted-foreground mt-2">shadow-md</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-card rounded-lg shadow-lg" />
                        <p className="text-xs text-muted-foreground mt-2">shadow-lg</p>
                      </div>
                      <div className="text-center">
                        <div className="w-20 h-20 bg-card rounded-lg shadow-xl" />
                        <p className="text-xs text-muted-foreground mt-2">shadow-xl</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Styleguide;
