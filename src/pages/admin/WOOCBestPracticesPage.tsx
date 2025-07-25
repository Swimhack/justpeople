import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  Users, 
  Code, 
  Database, 
  Shield,
  TrendingUp,
  BookOpen,
  FileText,
  Zap
} from "lucide-react";

const aiProjectBestPractices = [
  {
    category: "Project Planning",
    icon: Target,
    items: [
      {
        title: "Define Clear Objectives",
        description: "Establish specific, measurable goals for your AI project",
        details: "Start with business objectives and translate them into technical requirements. Use SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound) to define success metrics."
      },
      {
        title: "Understand Your Data",
        description: "Thoroughly analyze and understand your data before model development",
        details: "Perform extensive exploratory data analysis (EDA) to understand data distribution, quality, and potential biases. Document data sources, collection methods, and limitations."
      },
      {
        title: "Start with Simple Baselines",
        description: "Begin with simple models before moving to complex solutions",
        details: "Establish baseline performance with simple statistical models or rule-based systems. This provides a performance benchmark and helps identify if complex AI is actually needed."
      }
    ]
  },
  {
    category: "Data Management",
    icon: Database,
    items: [
      {
        title: "Data Quality First",
        description: "Ensure high-quality, clean, and representative data",
        details: "Implement data validation pipelines, handle missing values appropriately, and ensure data represents your target population. Poor data quality is the #1 cause of AI project failure."
      },
      {
        title: "Version Control for Data",
        description: "Track changes to datasets and maintain data lineage",
        details: "Use tools like DVC, MLflow, or custom solutions to version datasets. Document data transformations and maintain audit trails for regulatory compliance."
      },
      {
        title: "Privacy and Security",
        description: "Implement proper data privacy and security measures",
        details: "Follow GDPR, CCPA, and other relevant regulations. Use techniques like differential privacy, data anonymization, and secure multi-party computation when needed."
      }
    ]
  },
  {
    category: "Model Development",
    icon: Code,
    items: [
      {
        title: "Iterative Development",
        description: "Use agile, iterative approaches for model development",
        details: "Develop in short sprints with regular stakeholder feedback. Test hypotheses quickly and pivot when necessary. Use A/B testing to validate improvements."
      },
      {
        title: "Cross-Validation and Testing",
        description: "Implement robust validation and testing strategies",
        details: "Use appropriate cross-validation techniques, hold-out test sets, and temporal splits for time-series data. Test for edge cases and adversarial inputs."
      },
      {
        title: "Model Interpretability",
        description: "Ensure models are interpretable and explainable",
        details: "Use SHAP, LIME, or other explainability tools. Document model decisions and provide explanations for stakeholders. Consider simpler, more interpretable models when accuracy trade-offs are acceptable."
      }
    ]
  },
  {
    category: "Deployment & Operations",
    icon: Zap,
    items: [
      {
        title: "MLOps Implementation",
        description: "Implement proper MLOps practices for production deployment",
        details: "Use CI/CD pipelines for model deployment, automated testing, and monitoring. Implement model versioning and rollback capabilities."
      },
      {
        title: "Monitoring and Alerting",
        description: "Monitor model performance and data drift in production",
        details: "Track key metrics like accuracy, latency, and business KPIs. Set up alerts for performance degradation and data drift. Implement automated retraining when needed."
      },
      {
        title: "Scalability Planning",
        description: "Design for scale from the beginning",
        details: "Consider computational requirements, latency constraints, and cost implications. Use cloud services and containerization for flexible scaling."
      }
    ]
  },
  {
    category: "Team & Communication",
    icon: Users,
    items: [
      {
        title: "Cross-functional Collaboration",
        description: "Foster collaboration between technical and business teams",
        details: "Include domain experts, data scientists, engineers, and stakeholders in regular reviews. Use common language and visual tools to communicate complex concepts."
      },
      {
        title: "Documentation Standards",
        description: "Maintain comprehensive and up-to-date documentation",
        details: "Document data sources, model architectures, assumptions, and decisions. Use tools like Jupyter notebooks, model cards, and API documentation."
      },
      {
        title: "Knowledge Sharing",
        description: "Establish processes for knowledge sharing and learning",
        details: "Conduct regular tech talks, maintain wikis, and encourage experimentation. Learn from both successes and failures."
      }
    ]
  },
  {
    category: "Ethics & Compliance",
    icon: Shield,
    items: [
      {
        title: "Bias Detection and Mitigation",
        description: "Actively identify and address algorithmic bias",
        details: "Test models across different demographic groups, use fairness metrics, and implement bias mitigation techniques. Regular audits for discriminatory outcomes."
      },
      {
        title: "Regulatory Compliance",
        description: "Ensure compliance with relevant AI regulations",
        details: "Stay updated on AI regulations (EU AI Act, etc.), implement required documentation, and establish governance processes for AI systems."
      },
      {
        title: "Ethical AI Guidelines",
        description: "Develop and follow ethical AI principles",
        details: "Establish ethical review boards, consider societal impact, and implement human oversight mechanisms for high-risk applications."
      }
    ]
  }
];

const commonPitfalls = [
  {
    title: "Insufficient Data Quality Assessment",
    description: "Rushing to modeling without proper data exploration and cleaning",
    impact: "High",
    prevention: "Spend 70-80% of project time on data understanding and preparation"
  },
  {
    title: "Over-engineering Solutions",
    description: "Using complex AI when simple solutions would work better",
    impact: "Medium",
    prevention: "Always start with simple baselines and add complexity incrementally"
  },
  {
    title: "Lack of Business Alignment",
    description: "Building technically impressive models that don't solve business problems",
    impact: "High",
    prevention: "Regular stakeholder check-ins and clear success metrics definition"
  },
  {
    title: "Ignoring Model Drift",
    description: "Not monitoring model performance after deployment",
    impact: "High",
    prevention: "Implement comprehensive monitoring and automated retraining pipelines"
  },
  {
    title: "Inadequate Testing",
    description: "Insufficient testing for edge cases and adversarial inputs",
    impact: "Medium",
    prevention: "Develop comprehensive test suites including edge cases and stress tests"
  }
];

const aiProjectChecklist = [
  { category: "Planning", items: [
    "Business objectives clearly defined",
    "Success metrics identified and measurable",
    "Data availability and quality assessed",
    "Technical feasibility validated",
    "Timeline and resources estimated"
  ]},
  { category: "Data", items: [
    "Data sources identified and accessible",
    "Data quality assessment completed",
    "Privacy and security requirements addressed",
    "Data versioning system implemented",
    "Backup and recovery procedures established"
  ]},
  { category: "Development", items: [
    "Development environment set up",
    "Version control system configured",
    "Baseline model established",
    "Evaluation metrics defined",
    "Testing strategy implemented"
  ]},
  { category: "Deployment", items: [
    "Production environment prepared",
    "Monitoring systems configured",
    "Rollback procedures defined",
    "Documentation completed",
    "User training materials prepared"
  ]}
];

export default function WOOCBestPracticesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-primary" />
            WOOC Best Practices
          </h1>
          <p className="text-muted-foreground mt-2">
            AI project management guidelines and best practices
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="practices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
          <TabsTrigger value="pitfalls">Common Pitfalls</TabsTrigger>
          <TabsTrigger value="checklist">Project Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="practices" className="space-y-6">
          <div className="grid gap-6">
            {aiProjectBestPractices.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              return (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {category.items.map((item, itemIndex) => (
                        <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              {item.title}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <p className="font-medium text-muted-foreground">{item.description}</p>
                              <p className="text-sm">{item.details}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pitfalls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                Common AI Project Pitfalls
              </CardTitle>
              <CardDescription>
                Learn from common mistakes to avoid project failures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commonPitfalls.map((pitfall, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{pitfall.title}</h3>
                      <Badge variant={pitfall.impact === 'High' ? 'destructive' : 'secondary'}>
                        {pitfall.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{pitfall.description}</p>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                      <p className="text-sm"><strong>Prevention:</strong> {pitfall.prevention}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                AI Project Checklist
              </CardTitle>
              <CardDescription>
                Use this checklist to ensure all critical aspects are covered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {aiProjectChecklist.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {section.category}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="rounded border-border"
                            id={`${sectionIndex}-${itemIndex}`}
                          />
                          <label 
                            htmlFor={`${sectionIndex}-${itemIndex}`}
                            className="text-sm cursor-pointer"
                          >
                            {item}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            Quick Tips for AI Project Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Do's</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Start with clear business objectives</li>
                <li>• Invest heavily in data quality</li>
                <li>• Use version control for everything</li>
                <li>• Monitor models in production</li>
                <li>• Document decisions and assumptions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Don'ts</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Don't skip data exploration</li>
                <li>• Don't over-engineer solutions</li>
                <li>• Don't ignore model bias</li>
                <li>• Don't deploy without monitoring</li>
                <li>• Don't work in isolation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}