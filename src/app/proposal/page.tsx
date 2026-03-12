"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { proposalSubmitSchema, type ProposalSubmitInput, getIndustrySectorLabel, getGroupSizeLabel, getDeliveryModeLabel, getTimelineLabel } from "@/lib/validations/proposal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Loader2, ArrowLeft, FileText, Clock } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface ExpertiseNode {
  id: string
  title: string
  slug: string
}

export default function ProposalPage() {
  const [expertiseNodes, setExpertiseNodes] = useState<ExpertiseNode[]>([])
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [proposalRef, setProposalRef] = useState("")
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{
    canSubmit: boolean
    hoursRemaining: number
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProposalSubmitInput>({
    resolver: zodResolver(proposalSubmitSchema),
    defaultValues: {
      groupSize: "UNDER_20",
      deliveryMode: "ONLINE",
      consentFlag: false,
    },
  })

  const watchEmail = watch("email")
  const watchGroupSize = watch("groupSize")
  const watchDeliveryMode = watch("deliveryMode")
  const watchTimeline = watch("preferredTimeline")
  const watchIndustry = watch("industrySector")
  const watchTopic = watch("topicInterest")
  const watchConsent = watch("consentFlag")

  // Fetch expertise nodes for training topic dropdown
  useEffect(() => {
    const fetchExpertise = async () => {
      try {
        const response = await fetch("/api/expertise/tree")
        if (response.ok) {
          const data = await response.json()
          // Flatten the tree to get all nodes
          const nodes: ExpertiseNode[] = []
          data.forEach((node: any) => {
            nodes.push({ id: node.id, title: node.title, slug: node.slug })
            if (node.children) {
              node.children.forEach((child: any) => {
                nodes.push({ id: child.id, title: child.title, slug: child.slug })
              })
            }
          })
          setExpertiseNodes(nodes)
        }
      } catch (error) {
        console.error("Error fetching expertise nodes:", error)
      } finally {
        setLoadingNodes(false)
      }
    }
    fetchExpertise()
  }, [])

  // Check for duplicate submission when email changes
  useEffect(() => {
    if (!watchEmail || !watchEmail.includes("@")) {
      setDuplicateInfo(null)
      return
    }

    const checkDuplicate = async () => {
      setCheckingDuplicate(true)
      try {
        const response = await fetch(`/api/proposal/check-duplicate?email=${encodeURIComponent(watchEmail)}`)
        if (response.ok) {
          const data = await response.json()
          setDuplicateInfo({
            canSubmit: data.canSubmit,
            hoursRemaining: data.cooldown.hoursRemaining,
          })
        }
      } catch (error) {
        console.error("Error checking duplicate:", error)
      } finally {
        setCheckingDuplicate(false)
      }
    }

    const timeout = setTimeout(checkDuplicate, 500)
    return () => clearTimeout(timeout)
  }, [watchEmail])

  const onSubmit = async (data: ProposalSubmitInput) => {
    if (duplicateInfo && !duplicateInfo.canSubmit) {
      toast.error(`Please wait ${duplicateInfo.hoursRemaining} more hours before submitting again`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/proposal/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(result.message || "Please wait before submitting again")
        } else {
          toast.error(result.error || "Failed to submit proposal")
        }
        return
      }

      setProposalRef(result.proposal.id.slice(-8).toUpperCase())
      setSubmitted(true)
      toast.success("Proposal submitted successfully!")
      reset()
    } catch (error) {
      console.error("Error submitting proposal:", error)
      toast.error("Failed to submit proposal. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-green-500/20 bg-slate-900">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">
              Proposal Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-slate-400">
              Thank you for your interest in our training services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-800/50 border border-green-500/20 rounded-lg p-6">
              <p className="text-sm text-slate-400 mb-2">Reference Number</p>
              <p className="text-2xl font-bold text-green-400 font-mono">{proposalRef}</p>
            </div>

            <div className="space-y-3 text-slate-300">
              <p>
                We have received your proposal request and will review it shortly.
              </p>
              <p>
                A confirmation email has been sent to your inbox with the details of your request.
              </p>
              <p className="text-green-400">
                We will get back to you within 1-2 business days with a customized training proposal.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link href="/">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Request Training Proposal
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Fill in the details below and we will prepare a customized training proposal tailored to your organization&apos;s needs.
          </p>
        </div>

        {/* Form */}
        <Card className="bg-slate-900 border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-white">Proposal Request Form</CardTitle>
                <CardDescription className="text-slate-400">
                  All fields marked with * are required
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-slate-300">
                      Contact Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="contactName"
                      {...register("contactName")}
                      placeholder="John Doe"
                      disabled={submitting}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20"
                    />
                    {errors.contactName && (
                      <p className="text-sm text-red-400">{errors.contactName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organisation" className="text-slate-300">
                      Organisation <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="organisation"
                      {...register("organisation")}
                      placeholder="Acme Corporation"
                      disabled={submitting}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20"
                    />
                    {errors.organisation && (
                      <p className="text-sm text-red-400">{errors.organisation.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="john@company.com"
                      disabled={submitting}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email.message}</p>
                    )}
                    {checkingDuplicate && (
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking...
                      </p>
                    )}
                    {duplicateInfo && !duplicateInfo.canSubmit && (
                      <p className="text-sm text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Please wait {duplicateInfo.hoursRemaining} more hours before submitting again
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">
                      Phone <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="+60 12-345 6789"
                      disabled={submitting}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-400">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industrySector" className="text-slate-300">
                    Industry/Sector
                  </Label>
                  <Select
                    value={watchIndustry || ""}
                    onValueChange={(value) => setValue("industrySector", value as any)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select industry sector" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="TECHNOLOGY">{getIndustrySectorLabel("TECHNOLOGY")}</SelectItem>
                      <SelectItem value="FINANCE">{getIndustrySectorLabel("FINANCE")}</SelectItem>
                      <SelectItem value="HEALTHCARE">{getIndustrySectorLabel("HEALTHCARE")}</SelectItem>
                      <SelectItem value="MANUFACTURING">{getIndustrySectorLabel("MANUFACTURING")}</SelectItem>
                      <SelectItem value="EDUCATION">{getIndustrySectorLabel("EDUCATION")}</SelectItem>
                      <SelectItem value="GOVERNMENT">{getIndustrySectorLabel("GOVERNMENT")}</SelectItem>
                      <SelectItem value="RETAIL">{getIndustrySectorLabel("RETAIL")}</SelectItem>
                      <SelectItem value="ENERGY">{getIndustrySectorLabel("ENERGY")}</SelectItem>
                      <SelectItem value="CONSTRUCTION">{getIndustrySectorLabel("CONSTRUCTION")}</SelectItem>
                      <SelectItem value="CONSULTING">{getIndustrySectorLabel("CONSULTING")}</SelectItem>
                      <SelectItem value="TELECOMMUNICATIONS">{getIndustrySectorLabel("TELECOMMUNICATIONS")}</SelectItem>
                      <SelectItem value="TRANSPORTATION">{getIndustrySectorLabel("TRANSPORTATION")}</SelectItem>
                      <SelectItem value="MEDIA">{getIndustrySectorLabel("MEDIA")}</SelectItem>
                      <SelectItem value="NONPROFIT">{getIndustrySectorLabel("NONPROFIT")}</SelectItem>
                      <SelectItem value="OTHER">{getIndustrySectorLabel("OTHER")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Training Requirements Section */}
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
                  Training Requirements
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="topicInterest" className="text-slate-300">
                    Training Topic <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={watchTopic || ""}
                    onValueChange={(value) => setValue("topicInterest", value)}
                    disabled={submitting || loadingNodes}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder={loadingNodes ? "Loading topics..." : "Select training topic"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-80">
                      {expertiseNodes.map((node) => (
                        <SelectItem key={node.id} value={node.title}>
                          {node.title}
                        </SelectItem>
                      ))}
                      {/* Allow custom input by also having an "Other" option */}
                      <SelectItem value="custom">Other (specify in notes)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.topicInterest && (
                    <p className="text-sm text-red-400">{errors.topicInterest.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300">Group Size <span className="text-red-400">*</span></Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["UNDER_20", "BETWEEN_20_50", "BETWEEN_50_100", "OVER_100"].map((size) => (
                      <label
                        key={size}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                          watchGroupSize === size
                            ? "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                            : "border-slate-700 bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          value={size}
                          {...register("groupSize")}
                          className="sr-only"
                          disabled={submitting}
                        />
                        <span className={`text-sm font-medium text-center ${
                          watchGroupSize === size ? "text-green-400" : "text-slate-300"
                        }`}>
                          {getGroupSizeLabel(size)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.groupSize && (
                    <p className="text-sm text-red-400">{errors.groupSize.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300">Preferred Delivery Mode <span className="text-red-400">*</span></Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["ONLINE", "PHYSICAL", "HYBRID"].map((mode) => (
                      <label
                        key={mode}
                        className={`flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-all ${
                          watchDeliveryMode === mode
                            ? "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                            : "border-slate-700 bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          value={mode}
                          {...register("deliveryMode")}
                          className="sr-only"
                          disabled={submitting}
                        />
                        <span className={`text-sm font-medium ${
                          watchDeliveryMode === mode ? "text-green-400" : "text-slate-300"
                        }`}>
                          {getDeliveryModeLabel(mode)}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.deliveryMode && (
                    <p className="text-sm text-red-400">{errors.deliveryMode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTimeline" className="text-slate-300">
                    Preferred Timeline
                  </Label>
                  <Select
                    value={watchTimeline || ""}
                    onValueChange={(value) => setValue("preferredTimeline", value as any)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select preferred timeline" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ASAP">{getTimelineLabel("ASAP")}</SelectItem>
                      <SelectItem value="ONE_MONTH">{getTimelineLabel("ONE_MONTH")}</SelectItem>
                      <SelectItem value="THREE_MONTHS">{getTimelineLabel("THREE_MONTHS")}</SelectItem>
                      <SelectItem value="FLEXIBLE">{getTimelineLabel("FLEXIBLE")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes" className="text-slate-300">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    {...register("additionalNotes")}
                    placeholder="Tell us more about your specific requirements, learning objectives, or any questions you have..."
                    rows={4}
                    disabled={submitting}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20 resize-none"
                  />
                  {errors.additionalNotes && (
                    <p className="text-sm text-red-400">{errors.additionalNotes.message}</p>
                  )}
                </div>
              </div>

              {/* Consent Section */}
              <div className="pt-6 border-t border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("consentFlag")}
                    disabled={submitting}
                    className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500/20"
                  />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                    I consent to the collection and processing of my personal data for the purpose of receiving a training proposal. 
                    I understand that my information will be used to contact me regarding this inquiry. <span className="text-red-400">*</span>
                  </span>
                </label>
                {errors.consentFlag && (
                  <p className="text-sm text-red-400 mt-2">{errors.consentFlag.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting || (duplicateInfo !== null && !duplicateInfo.canSubmit)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Request Training Proposal"
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500 mt-3">
                  By submitting this form, you agree to our terms of service and privacy policy.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="mt-10 text-center">
          <p className="text-slate-400 text-sm">
            Prefer to contact us directly?{" "}
            <a href="mailto:msulfri@gmail.com" className="text-green-400 hover:text-green-300 transition-colors">
              msulfri@gmail.com
            </a>
            {" | "}
            <a href="https://wa.me/60123456789" className="text-green-400 hover:text-green-300 transition-colors">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
