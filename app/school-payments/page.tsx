"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CreditCard,
  Loader2,
  DollarSign,
} from "lucide-react"

// Define the PaymentAccount type
interface PaymentAccount {
  id: string
  schoolId: string
  accountName: string
  accountNumber: string
  bankCode: string
  bankName: string
  momoProvider?: string
  momoNumber?: string
  preferredMethod: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SchoolPaymentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null)
  const [formData, setFormData] = useState({
    schoolId: "",
    accountName: "",
    accountNumber: "",
    bankCode: "",
    bankName: "",
    momoProvider: "",
    momoNumber: "",
    preferredMethod: "BANK",
  })

  useEffect(() => {
    fetchPaymentAccounts()
  }, [])

  const { accessToken } = useAuth()

  const fetchPaymentAccounts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedMethod !== "ALL") params.append("preferredMethod", selectedMethod)

      const response = await fetch(`/api/payment-accounts?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch payment accounts")
      }

      const data = await response.json()
      setPaymentAccounts(data.paymentAccounts || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch payment accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePaymentAccount = async () => {
    try {
      const accountData: any = {
        ...formData,
      }

      // Filter out empty string fields
      Object.keys(accountData).forEach(key => {
        if (accountData[key] === "") {
          delete accountData[key]
        }
      })

      const response = await fetch("/api/payment-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(accountData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create payment account")
      }

      const data = await response.json()

      toast({
        title: "Success",
        description: data.message || "Payment account created successfully",
      })

      setIsCreateDialogOpen(false)
      resetForm()
      fetchPaymentAccounts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment account",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePaymentAccount = async () => {
    if (!editingAccount) return
    try {
      const accountData = {
        ...formData,
      }

      const response = await fetch(`/api/payment-accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(accountData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update payment account")
      }

      toast({
        title: "Success",
        description: "Payment account updated successfully",
      })
      setEditingAccount(null)
      resetForm()
      fetchPaymentAccounts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment account",
        variant: "destructive",
      })
    }
  }

  const handleDeletePaymentAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this payment account? This action cannot be undone.")) {
      return
    }
    try {
      const response = await fetch(`/api/payment-accounts/${accountId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete payment account")
      }

      toast({
        title: "Success",
        description: "Payment account deleted successfully",
      })
      fetchPaymentAccounts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment account",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      schoolId: "",
      accountName: "",
      accountNumber: "",
      bankCode: "",
      bankName: "",
      momoProvider: "",
      momoNumber: "",
      preferredMethod: "BANK",
    })
  }

  const openEditDialog = (account: PaymentAccount) => {
    setEditingAccount(account)
    setFormData({
      schoolId: account.schoolId,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankCode: account.bankCode,
      bankName: account.bankName,
      momoProvider: account.momoProvider || "",
      momoNumber: account.momoNumber || "",
      preferredMethod: account.preferredMethod,
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="School Payments Management" subtitle="Manage school payment accounts and transactions" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search payment accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Methods</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="MOMO">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Payment Account</DialogTitle>
                    <DialogDescription>Add a new payment account for school transactions</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolId">School ID *</Label>
                      <Input
                        id="schoolId"
                        value={formData.schoolId}
                        onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                        placeholder="Enter school ID"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name *</Label>
                      <Input
                        id="accountName"
                        value={formData.accountName}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                        placeholder="Enter account name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredMethod">Preferred Method *</Label>
                      <Select
                        value={formData.preferredMethod}
                        onValueChange={(value) => setFormData({ ...formData, preferredMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BANK">Bank Transfer</SelectItem>
                          <SelectItem value="MOMO">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.preferredMethod === "BANK" ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number *</Label>
                            <Input
                              id="accountNumber"
                              value={formData.accountNumber}
                              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                              placeholder="Enter account number"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bankCode">Bank Code *</Label>
                            <Input
                              id="bankCode"
                              value={formData.bankCode}
                              onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                              placeholder="Enter bank code"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name *</Label>
                          <Input
                            id="bankName"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            placeholder="Enter bank name"
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="momoProvider">Mobile Money Provider *</Label>
                            <Input
                              id="momoProvider"
                              value={formData.momoProvider}
                              onChange={(e) => setFormData({ ...formData, momoProvider: e.target.value })}
                              placeholder="e.g., MTN, Vodafone"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="momoNumber">Mobile Money Number *</Label>
                            <Input
                              id="momoNumber"
                              value={formData.momoNumber}
                              onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                              placeholder="Enter mobile money number"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePaymentAccount}>Create Payment Account</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Payment Accounts Grid */}
            {loading ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paymentAccounts.length === 0 ? (
              <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50/80 to-white/60 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-24 px-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl shadow-2xl">
                      <CreditCard className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No payment accounts found</h3>
                  <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                    {searchTerm || selectedMethod !== "ALL"
                      ? "We couldn't find any payment accounts matching your criteria. Try adjusting your filters or search terms."
                      : "Start managing school payments by adding your first payment account to the platform."}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    Add Your First Payment Account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {paymentAccounts.map((account) => (
                  <Card
                    key={account.id}
                    className="group h-full overflow-hidden border-0 shadow-sm hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                              <CreditCard className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors truncate">
                              {account.accountName}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs font-semibold px-2 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50"
                              >
                                {account.preferredMethod}
                              </Badge>
                              <Badge
                                variant={account.isActive ? "default" : "secondary"}
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  account.isActive
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {account.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(account)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePaymentAccount(account.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pt-0 pb-6">
                      <div className="space-y-2 mb-4">
                        {account.preferredMethod === "BANK" ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Account: {account.accountNumber}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Bank: {account.bankName} ({account.bankCode})</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Provider: {account.momoProvider}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Number: {account.momoNumber}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-400 font-medium">
                          ID: {account.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Payment Account</DialogTitle>
                  <DialogDescription>Update payment account information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-schoolId">School ID *</Label>
                    <Input
                      id="edit-schoolId"
                      value={formData.schoolId}
                      onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                      placeholder="Enter school ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-accountName">Account Name *</Label>
                    <Input
                      id="edit-accountName"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      placeholder="Enter account name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-preferredMethod">Preferred Method *</Label>
                    <Select
                      value={formData.preferredMethod}
                      onValueChange={(value) => setFormData({ ...formData, preferredMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="MOMO">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.preferredMethod === "BANK" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-accountNumber">Account Number *</Label>
                          <Input
                            id="edit-accountNumber"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            placeholder="Enter account number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-bankCode">Bank Code *</Label>
                          <Input
                            id="edit-bankCode"
                            value={formData.bankCode}
                            onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                            placeholder="Enter bank code"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-bankName">Bank Name *</Label>
                        <Input
                          id="edit-bankName"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          placeholder="Enter bank name"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-momoProvider">Mobile Money Provider *</Label>
                          <Input
                            id="edit-momoProvider"
                            value={formData.momoProvider}
                            onChange={(e) => setFormData({ ...formData, momoProvider: e.target.value })}
                            placeholder="e.g., MTN, Vodafone"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-momoNumber">Mobile Money Number *</Label>
                          <Input
                            id="edit-momoNumber"
                            value={formData.momoNumber}
                            onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                            placeholder="Enter mobile money number"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingAccount(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePaymentAccount}>Update Payment Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  )
}